import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreCase, DIFFICULTIES } from '../src/rules.js';
import { validateGeneratedCase, createRequestSchema } from '../src/schemas.js';
import { toPublicCase, toPublicResult } from '../src/serializers.js';

function makeFixture(difficulty, overrides = {}) {
  const conf = DIFFICULTIES[difficulty];
  const suspects = Array.from({ length: conf.suspects }, (_, i) => ({
    id: `suspect_${i + 1}`,
    name: `Suspect Name ${i + 1}`,
    role: `Role ${i + 1}`,
    description: `Description of suspect ${i + 1}`,
    statement: `Statement from suspect ${i + 1}`,
    alibi: `Alibi for suspect ${i + 1}`,
    publicFacts: [`Fact A about suspect ${i + 1}`, `Fact B about suspect ${i + 1}`],
  }));

  const clues = Array.from({ length: conf.clues }, (_, i) => ({
    id: `clue_${i + 1}`,
    title: `Clue Title ${i + 1}`,
    description: `Detailed clue description ${i + 1}`,
    location: `Location ${i + 1}`,
    significance: `Significance ${i + 1}`,
    suspectIds: [`suspect_${(i % conf.suspects) + 1}`],
  }));

  const hints = Array.from({ length: conf.hints }, (_, i) => ({
    id: `hint_${i + 1}`,
    text: `Hint text ${i + 1}`,
  }));

  const data = {
    title: `The Mystery Case (${difficulty})`,
    premise: 'A valuable antique jewel vanished from the gallery vault.',
    story: 'During an evening storm, thunder shook the manor and the lights went out.',
    suspects,
    clues,
    hints,
    privateSolution: {
      culpritId: 'suspect_1',
      motive: 'Financial desperation and old resentment.',
      explanation: 'Suspect 1 bypassed the security using a master key and disguised their alibi.',
      reasoning: 'Clues 1 and 2 directly establish the culprit had the only working keycard.',
      supportingClueIds: ['clue_1', 'clue_2'],
      redHerrings: ['The open window was meant to distract the police.'],
    },
    ...overrides,
  };

  return data;
}

test('validates generated case for all three difficulty levels', () => {
  for (const diff of ['easy', 'medium', 'hard']) {
    const fixture = makeFixture(diff);
    const validated = validateGeneratedCase(fixture, diff);
    assert.equal(validated.suspects.length, DIFFICULTIES[diff].suspects);
    assert.equal(validated.clues.length, DIFFICULTIES[diff].clues);
    assert.equal(validated.hints.length, DIFFICULTIES[diff].hints);
    assert.equal(validated.privateSolution.culpritId, 'suspect_1');
  }
});

test('rejects incorrect suspect, clue, or hint counts for a difficulty', () => {
  const easyCase = makeFixture('easy');
  easyCase.suspects.pop(); // 2 suspects instead of 3
  assert.throws(() => validateGeneratedCase(easyCase, 'easy'), /incorrect item counts/i);

  const mediumCase = makeFixture('medium');
  mediumCase.clues.pop(); // 6 clues instead of 7
  assert.throws(() => validateGeneratedCase(mediumCase, 'medium'), /incorrect item counts/i);

  const hardCase = makeFixture('hard');
  hardCase.hints.pop(); // 2 hints instead of 3
  assert.throws(() => validateGeneratedCase(hardCase, 'hard'), /incorrect item counts/i);
});

test('rejects duplicate IDs within suspects, clues, or hints', () => {
  const dupSuspect = makeFixture('easy');
  dupSuspect.suspects[1].id = dupSuspect.suspects[0].id;
  assert.throws(() => validateGeneratedCase(dupSuspect, 'easy'), /duplicate IDs/i);

  const dupClue = makeFixture('easy');
  dupClue.clues[1].id = dupClue.clues[0].id;
  assert.throws(() => validateGeneratedCase(dupClue, 'easy'), /duplicate IDs/i);

  const dupHint = makeFixture('easy');
  dupHint.hints[1].id = dupHint.hints[0].id;
  assert.throws(() => validateGeneratedCase(dupHint, 'easy'), /duplicate IDs/i);
});

test('rejects invalid references and missing supporting clues', () => {
  const badCulprit = makeFixture('easy', {
    privateSolution: {
      culpritId: 'nonexistent_suspect',
      motive: 'Greed',
      explanation: 'Did it.',
      reasoning: 'Reasons.',
      supportingClueIds: ['clue_1', 'clue_2'],
      redHerrings: [],
    },
  });
  assert.throws(() => validateGeneratedCase(badCulprit, 'easy'), /unknown culprit/i);

  const badSuspectRef = makeFixture('easy');
  badSuspectRef.clues[0].suspectIds = ['unknown_suspect'];
  assert.throws(() => validateGeneratedCase(badSuspectRef, 'easy'), /unknown suspect reference/i);

  const badClueRef = makeFixture('easy', {
    privateSolution: {
      culpritId: 'suspect_1',
      motive: 'Greed',
      explanation: 'Did it.',
      reasoning: 'Reasons.',
      supportingClueIds: ['clue_1', 'nonexistent_clue'],
      redHerrings: [],
    },
  });
  assert.throws(() => validateGeneratedCase(badClueRef, 'easy'), /unknown supporting clue/i);

  const singleSupportingClue = makeFixture('easy', {
    privateSolution: {
      culpritId: 'suspect_1',
      motive: 'Greed',
      explanation: 'Did it.',
      reasoning: 'Reasons.',
      supportingClueIds: ['clue_1', 'clue_1'],
      redHerrings: [],
    },
  });
  assert.throws(() => validateGeneratedCase(singleSupportingClue, 'easy'), /at least two distinct supporting clues/i);
});

test('premise and difficulty validation schemas', () => {
  assert.equal(createRequestSchema.safeParse({ premise: 'Too short', difficulty: 'easy' }).success, false);
  assert.equal(createRequestSchema.safeParse({ premise: 'A'.repeat(501), difficulty: 'easy' }).success, false);
  assert.equal(createRequestSchema.safeParse({ premise: 'A valid premise with adequate length for a detective mystery.', difficulty: 'expert' }).success, false);
  assert.equal(createRequestSchema.safeParse({ premise: 'A valid premise with adequate length for a detective mystery.', difficulty: 'easy' }).success, true);
  assert.equal(createRequestSchema.safeParse({ premise: 'A valid premise with adequate length for a detective mystery.', difficulty: 'medium' }).success, true);
  assert.equal(createRequestSchema.safeParse({ premise: 'A valid premise with adequate length for a detective mystery.', difficulty: 'hard' }).success, true);
});

test('scoring rules: base points, clue bonuses, hint penalties, and minimum score of 0', () => {
  // Easy: correct = 100
  const easyCorrect = scoreCase('easy', true, ['c1', 'c2', 'c3'], ['h1']);
  assert.deepEqual(easyCorrect, { basePoints: 100, cluePoints: 15, hintPenalty: 10, finalScore: 105 });

  // Medium: correct = 150
  const medCorrect = scoreCase('medium', true, ['c1', 'c2', 'c3', 'c4'], ['h1', 'h2']);
  assert.deepEqual(medCorrect, { basePoints: 150, cluePoints: 20, hintPenalty: 20, finalScore: 150 });

  // Hard: correct = 200
  const hardCorrect = scoreCase('hard', true, ['c1'], []);
  assert.deepEqual(hardCorrect, { basePoints: 200, cluePoints: 5, hintPenalty: 0, finalScore: 205 });

  // Wrong accusation: 0 base points, clues still count (+10), hint penalty (-10) -> final 0
  const wrongScore = scoreCase('easy', false, ['c1', 'c2'], ['h1']);
  assert.deepEqual(wrongScore, { basePoints: 0, cluePoints: 10, hintPenalty: 10, finalScore: 0 });

  // Score clamping: hints penalty exceeds clues, score must not drop below zero
  const clampedScore = scoreCase('easy', false, [], ['h1', 'h2']);
  assert.deepEqual(clampedScore, { basePoints: 0, cluePoints: 0, hintPenalty: 20, finalScore: 0 });

  // Duplicate clues in progress do not multiply score
  const dupScore = scoreCase('easy', true, ['c1', 'c1', 'c1'], ['h1', 'h1']);
  assert.deepEqual(dupScore, { basePoints: 100, cluePoints: 5, hintPenalty: 10, finalScore: 95 });
});

test('serializers strictly protect solution privacy before accusation', () => {
  const activeDoc = {
    _id: '0123456789abcdef01234567',
    title: 'Secret Murder',
    premise: 'A premise',
    story: 'A dark story',
    difficulty: 'easy',
    suspects: [
      { id: 's1', name: 'Alice', role: 'Heiress', description: 'Public description', statement: 'Statement', alibi: 'Alibi', publicFacts: ['Fact 1'] },
      { id: 's2', name: 'Bob', role: 'Butler', description: 'Public description', statement: 'Statement', alibi: 'Alibi', publicFacts: ['Fact 2'] },
      { id: 's3', name: 'Charlie', role: 'Chauffeur', description: 'Public description', statement: 'Statement', alibi: 'Alibi', publicFacts: ['Fact 3'] },
    ],
    clues: [
      { id: 'c1', title: 'Torn Letter', description: 'Secret letter confession', location: 'Fireplace', significance: 'Proves guilt', suspectIds: ['s1'] },
      { id: 'c2', title: 'Pocket Watch', description: 'Broken at 10 PM', location: 'Study', significance: 'Breaks alibi', suspectIds: ['s2'] },
    ],
    hints: [
      { id: 'h1', text: 'Check the fireplace' },
      { id: 'h2', text: 'Compare the watches' },
    ],
    privateSolution: {
      culpritId: 's1',
      motive: 'Inheritance money',
      explanation: 'Alice poisoned the wine and hid the vial in the fireplace.',
      reasoning: 'The torn letter links directly to her signature.',
      supportingClueIds: ['c1', 'c2'],
      redHerrings: ['Bob was arguing about pay.'],
    },
    progress: { discoveredClueIds: ['c1'], usedHintIds: ['h1'] },
    status: 'active',
  };

  const publicCase = toPublicCase(activeDoc);
  const serialized = JSON.stringify(publicCase);

  // Culprit, explanation, reasoning, unrevealed clue description, and unrevealed hint must not leak
  assert.equal(serialized.includes('culpritId'), false);
  assert.equal(serialized.includes('privateSolution'), false);
  assert.equal(serialized.includes('Alice poisoned the wine'), false);
  assert.equal(serialized.includes('Inheritance money'), false);
  assert.equal(serialized.includes('Broken at 10 PM'), false); // c2 undiscovered
  assert.equal(serialized.includes('Compare the watches'), false); // h2 unused

  // Discovered clue c1 should be exposed, undiscovered clue c2 description should NOT
  assert.equal(publicCase.discoveredClues.length, 1);
  assert.equal(publicCase.discoveredClues[0].id, 'c1');
  assert.equal(publicCase.discoveredClues[0].description, 'Secret letter confession');

  // Used hint h1 is present, unused h2 is NOT
  assert.equal(publicCase.hints.length, 1);
  assert.equal(publicCase.hints[0].id, 'h1');
  assert.equal(publicCase.hintsUsed, 1);
  assert.equal(publicCase.hintLimit, 2);

  // Result endpoint returns null for active cases
  assert.equal(toPublicResult(activeDoc), null);

  // When completed, result reveals culprit and explanation
  const completedDoc = {
    ...activeDoc,
    status: 'completed',
    accusation: { suspectId: 's1', isCorrect: true },
    score: { basePoints: 100, cluePoints: 5, hintPenalty: 10, finalScore: 95 },
  };

  const publicResult = toPublicResult(completedDoc);
  assert.equal(publicResult.verdict, 'solved');
  assert.equal(publicResult.isCorrect, true);
  assert.equal(publicResult.culprit.id, 's1');
  assert.equal(publicResult.culprit.name, 'Alice');
  assert.equal(publicResult.explanation, 'Alice poisoned the wine and hid the vial in the fireplace.');
  assert.equal(publicResult.score.finalScore, 95);
});
