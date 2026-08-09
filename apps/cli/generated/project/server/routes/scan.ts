import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

function analyzeResumeText(resumeText: string, jobKeywords: string[]): MatchResult {
  const lowerResume = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  jobKeywords.forEach((kw) => {
    if (lowerResume.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const score = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
  return { matchScore: score, matchedKeywords: matched, missingKeywords: missing };
}

router.post('/api/scan', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF resume file provided.' });
      return;
    }

    const { keywords } = req.body;
    const keywordList: string[] = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
    
    const parsedPdf = await pdfParse(req.file.buffer);
    const analysis = analyzeResumeText(parsedPdf.text, keywordList);

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      ...analysis,
    });
  } catch (error) {
    res.json([]);
  }
});

export default router;
export type { MatchResult };
