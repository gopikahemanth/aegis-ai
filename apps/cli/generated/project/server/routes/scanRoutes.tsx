import { Router } from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/scanController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

/**
 * @route POST /api/scan
 * @desc Process resume upload and keyword analysis
 * @access Private
 */
router.post('/scan', authMiddleware, upload.single('resume'), analyzeResume);

export default router;