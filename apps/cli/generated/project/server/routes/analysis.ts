import express, { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const router = express.Router();

router.post('/parse-resume', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const cleanText = pdfData.text.replace(/\s+/g, ' ').trim();

    return res.status(200).json({
      success: true,
      filename: req.file.originalname,
      pageCount: pdfData.numpages,
      extractedText: cleanText
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF';
    return res.json([]);
  }
});

export default router;