import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  filename: string;
  content: string;
  matchScore: number;
  keywordBreakdown: Array<{ keyword: string; found: boolean }>;
  createdAt: Date;
}

const ResumeSchema: Schema = new Schema({
  filename: { type: String, required: true },
  content: { type: String, required: true },
  matchScore: { type: Number, required: true },
  keywordBreakdown: [{
    keyword: { type: String, required: true },
    found: { type: Boolean, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IResume>('Resume', ResumeSchema);
export type Resume = any;
