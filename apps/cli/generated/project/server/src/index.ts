import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongoose from 'mongoose';
import { extractTextFromPDF, calculateMatchScore } from './utils/pdfParser';
import Resume from './models/Resume';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-scanner');

app.post('/api/scan', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { jobDescriptionKeywords } = req.body;
  const keywords = JSON.parse(jobDescriptionKeywords);

  try {
    const text = await extractTextFromPDF(req.file.path);
    const { score, found } = calculateMatchScore(text, keywords);

    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      extractedKeywords: found,
      matchScore: score
    });

    await resume.save();

    res.json({ score, found });
  } catch (error) {
    res.json([]);
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));