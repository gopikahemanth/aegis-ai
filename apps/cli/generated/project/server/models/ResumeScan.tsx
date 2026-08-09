import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeScan extends Document {
  userId: string;
  originalFileName: string;
  parsedText: string;
  jobDescription: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  createdAt: Date;
}

const ResumeScanSchema = new Schema({
  userId: { type: String, required: true, index: true },
  originalFileName: { type: String, required: true },
  parsedText: { type: String, required: true },
  jobDescription: { type: String, required: true },
  matchScore: { type: Number, required: true },
  matchedKeywords: [{ type: String }],
  missingKeywords: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const ResumeScan = mongoose.model<IResumeScan>('ResumeScan', ResumeScanSchema);