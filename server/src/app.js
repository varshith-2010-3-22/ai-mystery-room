import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { CaseModel } from './model.js';
import { createRequestSchema, accuseRequestSchema, validateGeneratedCase } from './schemas.js';
import { DIFFICULTIES, scoreCase } from './rules.js';
import { toPublicCase, toPublicResult } from './serializers.js';
import { generateMystery } from './gemini.js';

export function createApp({ Case = CaseModel, generator = generateMystery } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '12kb' }));
  const mutationLimit = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  const createLimit = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
  const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
  const validId = id => mongoose.isValidObjectId(id);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/api/cases', createLimit, asyncRoute(async (req, res) => {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) throw fail(400, 'VALIDATION_ERROR', 'Please provide a premise between 20 and 500 characters and choose a valid difficulty.');
    let generated;
    try { generated = validateGeneratedCase(await generator(parsed.data), parsed.data.difficulty); }
    catch (error) { console.error('Mystery generation failed:', error?.message); throw fail(502, 'GENERATION_FAILED', 'The case could not be prepared. Please try again.'); }
    const created = await Case.create({ ...generated, premise: parsed.data.premise, difficulty: parsed.data.difficulty, progress: { discoveredClueIds: [], usedHintIds: [] }, status: 'active' });
    res.status(201).json({ case: toPublicCase(created) });
  }));
  app.get('/api/cases/:id', asyncRoute(async (req, res) => {
    if (!validId(req.params.id)) throw fail(404, 'NOT_FOUND', 'Case not found.');
    const doc = await Case.findById(req.params.id).select('+privateSolution');
    if (!doc) throw fail(404, 'NOT_FOUND', 'Case not found.');
    res.json({ case: toPublicCase(doc) });
  }));
  app.post('/api/cases/:id/clues/:clueId/discover', mutationLimit, asyncRoute(async (req, res) => {
    if (!validId(req.params.id)) throw fail(404, 'NOT_FOUND', 'Case not found.');
    const doc = await Case.findById(req.params.id).select('+privateSolution');
    if (!doc) throw fail(404, 'NOT_FOUND', 'Case not found.');
    if (doc.status !== 'active') throw fail(409, 'CASE_COMPLETED', 'This case is already complete.');
    const clue = doc.clues.find(c => c.id === req.params.clueId);
    if (!clue) throw fail(404, 'NOT_FOUND', 'Clue not found.');
    await Case.updateOne({ _id: doc._id, status: 'active' }, { $addToSet: { 'progress.discoveredClueIds': clue.id } });
    const updated = await Case.findById(doc._id).select('+privateSolution');
    if (!updated || updated.status !== 'active') throw fail(409, 'CASE_COMPLETED', 'This case is already complete.');
    res.json({ case: toPublicCase(updated), clue: { id: clue.id, title: clue.title, description: clue.description, location: clue.location, significance: clue.significance } });
  }));
  app.post('/api/cases/:id/hints', mutationLimit, asyncRoute(async (req, res) => {
    if (!validId(req.params.id)) throw fail(404, 'NOT_FOUND', 'Case not found.');
    const doc = await Case.findById(req.params.id).select('+privateSolution');
    if (!doc) throw fail(404, 'NOT_FOUND', 'Case not found.');
    if (doc.status !== 'active') throw fail(409, 'CASE_COMPLETED', 'This case is already complete.');
    let next;
    let updated;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      next = doc.hints.find(h => !doc.progress.usedHintIds.includes(h.id));
      if (!next) throw fail(409, 'NO_HINTS_LEFT', 'You have used all available hints.');
      updated = await Case.findOneAndUpdate({ _id: doc._id, status: 'active', 'progress.usedHintIds': { $ne: next.id } }, { $addToSet: { 'progress.usedHintIds': next.id } }, { new: true }).select('+privateSolution');
      if (updated) break;
      const refreshed = await Case.findById(doc._id).select('+privateSolution');
      if (!refreshed || refreshed.status !== 'active') throw fail(409, 'CASE_COMPLETED', 'This case is already complete.');
      doc = refreshed;
    }
    if (!updated) throw fail(409, 'HINT_CONFLICT', 'Please request your next hint again.');
    res.json({ case: toPublicCase(updated), hint: next });
  }));
  app.post('/api/cases/:id/accuse', mutationLimit, asyncRoute(async (req, res) => {
    if (!validId(req.params.id)) throw fail(404, 'NOT_FOUND', 'Case not found.');
    const body = accuseRequestSchema.safeParse(req.body);
    if (!body.success) throw fail(400, 'VALIDATION_ERROR', 'Choose a valid suspect to accuse.');
    const doc = await Case.findById(req.params.id).select('+privateSolution');
    if (!doc) throw fail(404, 'NOT_FOUND', 'Case not found.');
    if (doc.status === 'completed') return res.json({ result: toPublicResult(doc) });
    const suspect = doc.suspects.find(s => s.id === body.data.suspectId);
    if (!suspect) throw fail(400, 'INVALID_SUSPECT', 'That suspect is not part of this case.');
    const isCorrect = suspect.id === doc.privateSolution.culpritId;
    const score = scoreCase(doc.difficulty, isCorrect, doc.progress.discoveredClueIds, doc.progress.usedHintIds);
    const completed = await Case.findOneAndUpdate({ _id: doc._id, status: 'active', 'progress.discoveredClueIds': doc.progress.discoveredClueIds, 'progress.usedHintIds': doc.progress.usedHintIds }, { $set: { accusation: { suspectId: suspect.id, isCorrect }, score, status: 'completed', completedAt: new Date() } }, { new: true }).select('+privateSolution');
    if (completed) return res.json({ result: toPublicResult(completed) });
    const winner = await Case.findById(doc._id).select('+privateSolution');
    if (winner?.status === 'completed') return res.json({ result: toPublicResult(winner) });
    throw fail(409, 'CASE_CONFLICT', 'The case changed while your accusation was submitted. Please try again.');
  }));
  app.get('/api/cases/:id/result', asyncRoute(async (req, res) => {
    if (!validId(req.params.id)) throw fail(404, 'NOT_FOUND', 'Case not found.');
    const doc = await Case.findById(req.params.id).select('+privateSolution');
    if (!doc) throw fail(404, 'NOT_FOUND', 'Case not found.');
    if (doc.status !== 'completed') throw fail(409, 'CASE_ACTIVE', 'This case has not been completed.');
    res.json({ result: toPublicResult(doc) });
  }));
  app.use((req, _res, next) => next(fail(404, 'NOT_FOUND', 'That page could not be found.')));
  app.use((error, _req, res, _next) => {
    if (error?.name === 'ZodError') return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'The request could not be validated.' } });
    const status = error.status || (error.name === 'MongoServerError' ? 503 : 500);
    if (status >= 500) console.error('Request failed:', error.message);
    res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: status >= 500 && !error.code ? 'Something went wrong. Please try again.' : error.message } });
  });
  return app;
}
