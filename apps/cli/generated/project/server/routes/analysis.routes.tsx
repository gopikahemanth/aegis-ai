import { Router } from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const router = Router();

router.post(
  '/analyze',
  authenticate,
  upload.fields([{ name: 'resume' }, { name: 'jd' }]),
  analyzeResume
);

export default router;