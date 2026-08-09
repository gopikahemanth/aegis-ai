import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { db } from './db';
import { resumes } from './db/schema';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

interface AnalysisRequestBody {
  jobDescription: string;
}

app.post('/api/analyze', upload.single('resume'), async (req: Request<{}, {}, AnalysisRequestBody>, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const jobDescription = req.body.jobDescription || '';
    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text.toLowerCase();

    // Extract unique keywords from job description (min length 4)
    const rawWords = jobDescription.toLowerCase().split(/\W+/);
    const uniqueKeywords = [...new Set(rawWords.filter((w: string) => w.length > 3))];
    
    const foundKeywords = uniqueKeywords.filter(word => resumeText.includes(word));
    const missingKeywords = uniqueKeywords.filter(word => !foundKeywords.includes(word));
    
    const score = uniqueKeywords.length > 0 
      ? (foundKeywords.length / uniqueKeywords.length) * 100 
      : 0;

    const record = await db.insert(resumes).values({
      fileName: req.file.originalname,
      content: data.text,
      keywords: { 
        found: foundKeywords, 
        missing: missingKeywords 
      },
      matchScore: score
    }).returning();

    return res.json(record[0]);
  } catch (error) {
    console.error('Analysis Error:', error);
    return res.json([]);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export type { AnalysisRequestBody };
