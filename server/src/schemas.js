import { z } from 'zod';
import { DIFFICULTIES } from './rules.js';

const short = (max) => z.string().trim().min(1).max(max);
const unique = (arr) => new Set(arr.map(x => x.id)).size === arr.length;
const suspect = z.object({ id: short(40), name: short(80), role: short(80), description: short(600), statement: short(600), alibi: short(400), publicFacts: z.array(short(250)).min(1).max(4) });
const clue = z.object({ id: short(40), title: short(100), description: short(700), location: short(100), significance: short(400), suspectIds: z.array(short(40)).min(1) });
const hint = z.object({ id: short(40), text: short(300) });
export const generatedCaseSchema = z.object({
  title: short(100), premise: short(500), story: short(2200), suspects: z.array(suspect), clues: z.array(clue), hints: z.array(hint),
  privateSolution: z.object({ culpritId: short(40), motive: short(500), explanation: short(1600), reasoning: short(1600), supportingClueIds: z.array(short(40)).min(2), redHerrings: z.array(short(300)).max(5) }),
});
export const createRequestSchema = z.object({ premise: z.string().trim().min(20).max(500), difficulty: z.enum(['easy', 'medium', 'hard']) });
export const accuseRequestSchema = z.object({ suspectId: z.string().trim().min(1).max(40) });

export function validateGeneratedCase(raw, difficulty) {
  const data = generatedCaseSchema.parse(raw);
  const required = DIFFICULTIES[difficulty];
  if (!required || data.suspects.length !== required.suspects || data.clues.length !== required.clues || data.hints.length !== required.hints) throw new Error('Generated case has incorrect item counts.');
  if (![data.suspects, data.clues, data.hints].every(unique)) throw new Error('Generated case contains duplicate IDs.');
  const suspects = new Set(data.suspects.map(x => x.id));
  const clues = new Set(data.clues.map(x => x.id));
  if (!suspects.has(data.privateSolution.culpritId)) throw new Error('Unknown culprit.');
  if (data.clues.some(c => c.suspectIds.some(id => !suspects.has(id)))) throw new Error('Unknown suspect reference.');
  if (data.privateSolution.supportingClueIds.some(id => !clues.has(id))) throw new Error('Unknown supporting clue.');
  if (new Set(data.privateSolution.supportingClueIds).size < 2) throw new Error('At least two distinct supporting clues are required.');
  return data;
}
