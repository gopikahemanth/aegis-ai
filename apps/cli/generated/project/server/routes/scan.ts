import { Router } from 'express';
import multer from 'multer';
import { parseResumeAndCalculateMatch } from '../controllers/scanController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('resume'), parseResumeAndCalculateMatch);

export default router;