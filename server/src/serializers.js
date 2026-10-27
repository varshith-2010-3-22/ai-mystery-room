export function toPublicCase(doc) {
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const discovered = new Set(d.progress.discoveredClueIds);
  const used = new Set(d.progress.usedHintIds);
  return { id: String(d._id), title: d.title, premise: d.premise, story: d.story, difficulty: d.difficulty,
    suspects: d.suspects.map(({ id, name, role, description, statement, alibi, publicFacts }) => ({ id, name, role, description, statement, alibi, publicFacts })),
    clues: d.clues.map(({ id, title, location }) => ({ id, title, location, discovered: discovered.has(id) })),
    discoveredClues: d.clues.filter(c => discovered.has(c.id)).map(({ id, title, description, location, significance }) => ({ id, title, description, location, significance })),
    hints: d.hints.filter(h => used.has(h.id)).map(({ id, text }) => ({ id, text })), hintLimit: d.hints.length, hintsUsed: used.size,
    progress: { discovered: discovered.size, total: d.clues.length }, status: d.status };
}
export function toPublicResult(doc) {
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  if (d.status !== 'completed') return null;
  const culprit = d.suspects.find(s => s.id === d.privateSolution.culpritId);
  return { id: String(d._id), verdict: d.accusation.isCorrect ? 'solved' : 'wrong', isCorrect: d.accusation.isCorrect,
    culprit: { id: culprit.id, name: culprit.name, role: culprit.role }, explanation: d.privateSolution.explanation,
    score: d.score, cluesDiscovered: d.progress.discoveredClueIds.length, hintsUsed: d.progress.usedHintIds.length, difficulty: d.difficulty };
}
