import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DIFFICULTIES } from '../src/rules.js';

function makeMockMystery(difficulty = 'easy') {
  const conf = DIFFICULTIES[difficulty];
  return {
    title: `The Mystery of Room 101 (${difficulty})`,
    difficulty,
    premise: 'A rare manuscript was stolen during a thunderstorm at the library.',
    story: 'Four scholars were present when the lights went out in the rare book wing.',
    suspects: Array.from({ length: conf.suspects }, (_, i) => ({
      id: `suspect_${i + 1}`,
      name: `Scholar ${i + 1}`,
      role: `Role ${i + 1}`,
      description: `Description of scholar ${i + 1}`,
      statement: `Statement from scholar ${i + 1}`,
      alibi: `Alibi for scholar ${i + 1}`,
      publicFacts: [`Public record ${i + 1}`],
    })),
    clues: Array.from({ length: conf.clues }, (_, i) => ({
      id: `clue_${i + 1}`,
      title: `Clue Title ${i + 1}`,
      description: `Revealed clue description ${i + 1}`,
      location: `Reading desk ${i + 1}`,
      significance: `Points to suspect ${(i % conf.suspects) + 1}`,
      suspectIds: [`suspect_${(i % conf.suspects) + 1}`],
    })),
    hints: Array.from({ length: conf.hints }, (_, i) => ({
      id: `hint_${i + 1}`,
      text: `Investigation hint ${i + 1}`,
    })),
    privateSolution: {
      culpritId: 'suspect_1',
      motive: 'To hide forged annotations.',
      explanation: 'Scholar 1 pocketed the manuscript under their raincoat.',
      reasoning: 'Clues 1 and 2 reveal the raincoat fabric fibers.',
      supportingClueIds: ['clue_1', 'clue_2'],
      redHerrings: ['The wet footprint near the back door.'],
    },
  };
}

function createMemoryCase(initialDocs = []) {
  let counter = 1;
  const store = new Map();

  for (const doc of initialDocs) {
    const id = doc._id ? String(doc._id) : `507f1f77bcf86cd7994390${String(counter++).padStart(2, '0')}`;
    store.set(id, structuredClone({ ...doc, _id: id }));
  }

  function wrapDoc(doc) {
    if (!doc) return null;
    const cloned = structuredClone(doc);
    return {
      ...cloned,
      toObject: () => structuredClone(cloned),
    };
  }

  return {
    _store: store,
    create: async (data) => {
      const id = `507f1f77bcf86cd7994390${String(counter++).padStart(2, '0')}`;
      const doc = structuredClone({ ...data, _id: id });
      store.set(id, doc);
      return wrapDoc(doc);
    },
    findById: (id) => ({
      select: async () => wrapDoc(store.get(String(id))),
    }),
    updateOne: async (query, update) => {
      const id = String(query._id);
      const doc = store.get(id);
      if (!doc || doc.status !== query.status) return { modifiedCount: 0 };
      if (update.$addToSet?.['progress.discoveredClueIds']) {
        const clueId = update.$addToSet['progress.discoveredClueIds'];
        if (!doc.progress.discoveredClueIds.includes(clueId)) {
          doc.progress.discoveredClueIds.push(clueId);
        }
      }
      return { modifiedCount: 1 };
    },
    findOneAndUpdate: (query, update, _opts) => ({
      select: async () => {
        const id = String(query._id);
        const doc = store.get(id);
        if (!doc || (query.status && doc.status !== query.status)) return null;

        if (update.$addToSet?.['progress.usedHintIds']) {
          const hintId = update.$addToSet['progress.usedHintIds'];
          if (query['progress.usedHintIds']?.$ne && doc.progress.usedHintIds.includes(hintId)) {
            return null;
          }
          if (!doc.progress.usedHintIds.includes(hintId)) {
            doc.progress.usedHintIds.push(hintId);
          }
        }

        if (update.$set) {
          Object.assign(doc, structuredClone(update.$set));
        }

        return wrapDoc(doc);
      },
    }),
  };
}

test('GET /api/health returns status ok', async () => {
  const response = await request(createApp()).get('/api/health').expect(200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('POST /api/cases creates case and returns public fields without privateSolution', async () => {
  const memoryCase = createMemoryCase();
  const app = createApp({
    Case: memoryCase,
    generator: async () => makeMockMystery('easy'),
  });

  const response = await request(app)
    .post('/api/cases')
    .send({
      premise: 'A valuable antique vanished during a storm at the manor.',
      difficulty: 'easy',
    })
    .expect(201);

  const payload = response.body.case;
  assert.ok(payload.id);
  assert.equal(payload.difficulty, 'easy');
  assert.equal(payload.suspects.length, 3);
  assert.equal(payload.clues.length, 5);
  assert.equal(payload.hintLimit, 2);
  assert.equal(payload.hintsUsed, 0);
  assert.equal(payload.progress.discovered, 0);
  assert.equal(payload.status, 'active');

  // Solution must not be exposed
  assert.equal(response.text.includes('culpritId'), false);
  assert.equal(response.text.includes('privateSolution'), false);
  assert.equal(response.text.includes('Scholar 1 pocketed the manuscript'), false);
});

test('POST /api/cases handles Gemini generator failure gracefully (502)', async () => {
  const memoryCase = createMemoryCase();
  const app = createApp({
    Case: memoryCase,
    generator: async () => { throw new Error('AI service rate limited'); },
  });

  const response = await request(app)
    .post('/api/cases')
    .send({
      premise: 'A mystery premise with enough characters to pass validation.',
      difficulty: 'medium',
    })
    .expect(502);

  assert.equal(response.body.error.code, 'GENERATION_FAILED');
  assert.equal(memoryCase._store.size, 0); // No invalid case stored
});

test('GET /api/cases/:id handles invalid and nonexistent IDs', async () => {
  const app = createApp({ Case: createMemoryCase() });

  // Invalid format (not a 24-character hex ObjectId)
  const invalidResp = await request(app).get('/api/cases/not-an-objectid').expect(404);
  assert.equal(invalidResp.body.error.code, 'NOT_FOUND');

  // Valid format but missing in DB
  const missingResp = await request(app).get('/api/cases/507f1f77bcf86cd799439099').expect(404);
  assert.equal(missingResp.body.error.code, 'NOT_FOUND');
});

test('POST /api/cases/:id/clues/:clueId/discover reveals clue and is idempotent', async () => {
  const rawMystery = makeMockMystery('easy');
  const memoryCase = createMemoryCase([{
    ...rawMystery,
    status: 'active',
    progress: { discoveredClueIds: [], usedHintIds: [] },
  }]);

  const [caseId] = memoryCase._store.keys();
  const app = createApp({ Case: memoryCase });

  // 1. Discover first clue
  const res1 = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_1/discover`)
    .expect(200);

  assert.equal(res1.body.clue.id, 'clue_1');
  assert.equal(res1.body.clue.description, 'Revealed clue description 1');
  assert.equal(res1.body.case.progress.discovered, 1);
  assert.equal(res1.body.case.discoveredClues.length, 1);

  // 2. Discover same clue again (must be idempotent, not duplicate score/progress)
  const res2 = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_1/discover`)
    .expect(200);

  assert.equal(res2.body.case.progress.discovered, 1);
  assert.equal(res2.body.case.discoveredClues.length, 1);

  // 3. Discover non-existent clue
  const resBad = await request(app)
    .post(`/api/cases/${caseId}/clues/nonexistent_clue/discover`)
    .expect(404);
  assert.equal(resBad.body.error.code, 'NOT_FOUND');
});

test('POST /api/cases/:id/hints enforces difficulty limits and handles exhaustion', async () => {
  const rawMystery = makeMockMystery('easy'); // easy allows 2 hints
  const memoryCase = createMemoryCase([{
    ...rawMystery,
    status: 'active',
    progress: { discoveredClueIds: [], usedHintIds: [] },
  }]);

  const [caseId] = memoryCase._store.keys();
  const app = createApp({ Case: memoryCase });

  // Request hint 1
  const h1 = await request(app).post(`/api/cases/${caseId}/hints`).expect(200);
  assert.equal(h1.body.hint.id, 'hint_1');
  assert.equal(h1.body.case.hintsUsed, 1);

  // Request hint 2
  const h2 = await request(app).post(`/api/cases/${caseId}/hints`).expect(200);
  assert.equal(h2.body.hint.id, 'hint_2');
  assert.equal(h2.body.case.hintsUsed, 2);

  // Request hint 3 (limit reached -> 409 NO_HINTS_LEFT)
  const h3 = await request(app).post(`/api/cases/${caseId}/hints`).expect(409);
  assert.equal(h3.body.error.code, 'NO_HINTS_LEFT');
});

test('POST /api/cases/:id/accuse validates suspect and calculates score for correct and wrong accusation', async () => {
  const rawMystery = makeMockMystery('easy'); // easy base = 100
  const memoryCase = createMemoryCase([
    {
      ...rawMystery,
      status: 'active',
      progress: { discoveredClueIds: ['clue_1', 'clue_2'], usedHintIds: ['hint_1'] },
    },
    {
      ...rawMystery,
      status: 'active',
      progress: { discoveredClueIds: ['clue_1'], usedHintIds: [] },
    },
  ]);

  const [idCorrect, idWrong] = memoryCase._store.keys();
  const app = createApp({ Case: memoryCase });

  // Accuse invalid suspect
  const badSuspect = await request(app)
    .post(`/api/cases/${idCorrect}/accuse`)
    .send({ suspectId: 'alien_suspect' })
    .expect(400);
  assert.equal(badSuspect.body.error.code, 'INVALID_SUSPECT');

  // Correct accusation: suspect_1 is the culprit
  // 100 base + (2 clues * 5 = 10) - (1 hint * 10 = 10) = 100 final
  const correctRes = await request(app)
    .post(`/api/cases/${idCorrect}/accuse`)
    .send({ suspectId: 'suspect_1' })
    .expect(200);

  assert.equal(correctRes.body.result.verdict, 'solved');
  assert.equal(correctRes.body.result.isCorrect, true);
  assert.equal(correctRes.body.result.culprit.id, 'suspect_1');
  assert.deepEqual(correctRes.body.result.score, {
    basePoints: 100,
    cluePoints: 10,
    hintPenalty: 10,
    finalScore: 100,
  });

  // Duplicate accusation on already completed case returns existing result idempotently
  const dupAccuse = await request(app)
    .post(`/api/cases/${idCorrect}/accuse`)
    .send({ suspectId: 'suspect_1' })
    .expect(200);
  assert.equal(dupAccuse.body.result.score.finalScore, 100);

  // Wrong accusation: suspect_2 is innocent
  // 0 base + (1 clue * 5 = 5) - (0 hints = 0) = 5 final
  const wrongRes = await request(app)
    .post(`/api/cases/${idWrong}/accuse`)
    .send({ suspectId: 'suspect_2' })
    .expect(200);

  assert.equal(wrongRes.body.result.verdict, 'wrong');
  assert.equal(wrongRes.body.result.isCorrect, false);
  assert.equal(wrongRes.body.result.score.basePoints, 0);
  assert.equal(wrongRes.body.result.score.finalScore, 5);
});

test('Completed case locks mutations and allows result inspection', async () => {
  const rawMystery = makeMockMystery('easy');
  const memoryCase = createMemoryCase([{
    ...rawMystery,
    status: 'completed',
    accusation: { suspectId: 'suspect_1', isCorrect: true },
    score: { basePoints: 100, cluePoints: 10, hintPenalty: 0, finalScore: 110 },
    progress: { discoveredClueIds: ['clue_1', 'clue_2'], usedHintIds: [] },
  }]);

  const [caseId] = memoryCase._store.keys();
  const app = createApp({ Case: memoryCase });

  // 1. Clue discovery on completed case returns 409 CASE_COMPLETED
  const clueRes = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_3/discover`)
    .expect(409);
  assert.equal(clueRes.body.error.code, 'CASE_COMPLETED');

  // 2. Hint request on completed case returns 409 CASE_COMPLETED
  const hintRes = await request(app)
    .post(`/api/cases/${caseId}/hints`)
    .expect(409);
  assert.equal(hintRes.body.error.code, 'CASE_COMPLETED');

  // 3. GET result on completed case returns culprit and solution
  const resultRes = await request(app)
    .get(`/api/cases/${caseId}/result`)
    .expect(200);

  assert.equal(resultRes.body.result.verdict, 'solved');
  assert.equal(resultRes.body.result.culprit.id, 'suspect_1');
  assert.equal(resultRes.body.result.explanation, 'Scholar 1 pocketed the manuscript under their raincoat.');
});

test('Full end-to-end game journey: create -> investigate -> discover clues -> request hints -> accuse -> view results', async () => {
  const memoryCase = createMemoryCase();
  const app = createApp({
    Case: memoryCase,
    generator: async () => makeMockMystery('easy'),
  });

  // Step 1: Create mystery
  const createRes = await request(app)
    .post('/api/cases')
    .send({
      premise: 'A priceless sapphire vanished from the locked private study during a heavy thunderstorm.',
      difficulty: 'easy',
    })
    .expect(201);

  const caseId = createRes.body.case.id;
  assert.ok(caseId);
  assert.equal(createRes.body.case.status, 'active');
  assert.equal(createRes.text.includes('culpritId'), false);
  assert.equal(createRes.text.includes('privateSolution'), false);

  // Step 2: Retrieve active case file
  const activeRes = await request(app).get(`/api/cases/${caseId}`).expect(200);
  assert.equal(activeRes.body.case.progress.discovered, 0);
  assert.equal(activeRes.body.case.hintsUsed, 0);
  assert.equal(activeRes.body.case.clues.length, 5);

  // Step 3: Discover clue 1
  const clue1Res = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_1/discover`)
    .expect(200);
  assert.equal(clue1Res.body.case.progress.discovered, 1);
  assert.equal(clue1Res.body.clue.id, 'clue_1');

  // Step 4: Discover clue 2
  const clue2Res = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_2/discover`)
    .expect(200);
  assert.equal(clue2Res.body.case.progress.discovered, 2);

  // Step 5: Repeated discovery of clue 2 (must remain 2)
  const clue2Repeat = await request(app)
    .post(`/api/cases/${caseId}/clues/clue_2/discover`)
    .expect(200);
  assert.equal(clue2Repeat.body.case.progress.discovered, 2);

  // Step 6: Request a hint
  const hintRes = await request(app).post(`/api/cases/${caseId}/hints`).expect(200);
  assert.equal(hintRes.body.case.hintsUsed, 1);
  assert.equal(hintRes.body.hint.id, 'hint_1');

  // Step 7: Pre-accusation result inspection must be blocked (409)
  await request(app).get(`/api/cases/${caseId}/result`).expect(409);

  // Step 8: Accuse suspect_1 (the correct culprit)
  // Easy base: 100 + (2 clues * 5 = 10) - (1 hint * 10 = 10) = 100
  const accuseRes = await request(app)
    .post(`/api/cases/${caseId}/accuse`)
    .send({ suspectId: 'suspect_1' })
    .expect(200);

  assert.equal(accuseRes.body.result.verdict, 'solved');
  assert.equal(accuseRes.body.result.isCorrect, true);
  assert.equal(accuseRes.body.result.score.finalScore, 100);

  // Step 9: Post-accusation result inspection succeeds
  const finalResultRes = await request(app).get(`/api/cases/${caseId}/result`).expect(200);
  assert.equal(finalResultRes.body.result.verdict, 'solved');
  assert.equal(finalResultRes.body.result.culprit.id, 'suspect_1');
  assert.ok(finalResultRes.body.result.explanation);

  // Step 10: Mutations are locked on completed case
  await request(app).post(`/api/cases/${caseId}/clues/clue_3/discover`).expect(409);
  await request(app).post(`/api/cases/${caseId}/hints`).expect(409);
});

