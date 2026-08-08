import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  createdAt: Date;
}

const AnalysisSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: { type: Number, required: true },
  matchedKeywords: [String],
  missingKeywords: [String],
  createdAt: { type: Date, default: Date.now }
});

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
export type Index = any;
