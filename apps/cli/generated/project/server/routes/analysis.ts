import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

interface AnalysisResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

router.post('/analyze', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobDescription, keywords } = req.body;
    const keywordList: string[] = JSON.parse(keywords || '[]');
    
    const data = await pdfParse(req.file.buffer);
    const text = data.text.toLowerCase();

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywordList.forEach((kw) => {
      if (text.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const score = keywordList.length > 0 
      ? Math.round((matchedKeywords.length / keywordList.length) * 100) 
      : 0;

    const result: AnalysisResult = {
      score,
      matchedKeywords,
      missingKeywords
    };

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.json([]);
  }
});

export default router;
export type { AnalysisResult };
