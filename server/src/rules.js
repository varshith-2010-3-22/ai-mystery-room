export const DIFFICULTIES = {
  easy: { suspects: 3, clues: 5, hints: 2, base: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, base: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, base: 200 },
};

export function scoreCase(difficulty, isCorrect, clueIds, hintIds) {
  const uniqueClues = new Set(clueIds).size;
  const uniqueHints = new Set(hintIds).size;
  const basePoints = isCorrect ? DIFFICULTIES[difficulty].base : 0;
  const cluePoints = uniqueClues * 5;
  const hintPenalty = uniqueHints * 10;
  return { basePoints, cluePoints, hintPenalty, finalScore: Math.max(0, basePoints + cluePoints - hintPenalty) };
}
