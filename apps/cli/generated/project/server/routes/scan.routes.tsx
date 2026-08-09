import { Router } from 'express';
import multer from 'multer';
import { parseResumeAndCalculateMatch } from '../controllers/scan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/analyze', authenticate, upload.single('resume'), parseResumeAndCalculateMatch);

export default router;