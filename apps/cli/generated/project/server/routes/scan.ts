import express, { Request, Response } from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/analysisController';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('resume'), async (req: Request, res: Response) => {
  await analyzeResume(req, res);
});

export default router;