import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeResumeController } from './controllers/analysisController';
import { authMiddleware } from './middleware/authMiddleware';

export const prisma = new PrismaClient();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Protected Analysis Route
app.post('/api/scan/analyze', 
  authMiddleware, 
  upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jd', maxCount: 1 }]), 
  analyzeResumeController
);

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
