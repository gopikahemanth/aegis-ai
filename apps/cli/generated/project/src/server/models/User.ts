import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
export const User = mongoose.model('User', userSchema);

// src/server/models/Analysis.ts
import mongoose from 'mongoose';
const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: { type: Number, required: true },
  matchedKeywords: [String],
  missingSkillsCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
export const Analysis = mongoose.model('Analysis', analysisSchema);
export default User;
