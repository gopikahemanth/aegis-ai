import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  filename: string;
  originalName: string;
  extractedKeywords: string[];
  matchScore: number;
  createdAt: Date;
}

const ResumeSchema: Schema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  extractedKeywords: { type: [String], required: true },
  matchScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IResume>('Resume', ResumeSchema);
export type Resume = any;
