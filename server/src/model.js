import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
  title: { type: String, required: true }, premise: { type: String, required: true }, story: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }, suspects: { type: [mongoose.Schema.Types.Mixed], required: true }, clues: { type: [mongoose.Schema.Types.Mixed], required: true }, hints: { type: [mongoose.Schema.Types.Mixed], required: true },
  privateSolution: { type: mongoose.Schema.Types.Mixed, required: true, select: false }, progress: { discoveredClueIds: { type: [String], default: [] }, usedHintIds: { type: [String], default: [] } },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }, accusation: { suspectId: String, isCorrect: Boolean }, score: { basePoints: Number, cluePoints: Number, hintPenalty: Number, finalScore: Number }, completedAt: Date,
}, { timestamps: true, minimize: false });
CaseSchema.index({ status: 1, createdAt: -1 });
export const CaseModel = mongoose.models.Case || mongoose.model('Case', CaseSchema);
