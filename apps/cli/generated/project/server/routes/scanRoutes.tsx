import express from 'express';
import { parseResume } from '../controllers/uploadController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticate, upload.single('resume'), parseResume);

export default router;