import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeScan extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  matchScore: number;
  matchedKeywords: string[];
  missingSkills: string[];
  createdAt: Date;
}

const ResumeScanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  matchScore: { type: Number, required: true },
  matchedKeywords: [String],
  missingSkills: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IResumeScan>('ResumeScan', ResumeScanSchema);
export type ResumeScan = any;
