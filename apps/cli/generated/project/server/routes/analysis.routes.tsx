import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { analyzeResume } from '../controllers/analysis.controller';

const router = Router();

/**
 * @route POST /api/analysis/scan
 * @desc Accepts resume text and job description to perform keyword analysis
 * @access Private
 */
router.post('/scan', authenticate, analyzeResume);

export default router;