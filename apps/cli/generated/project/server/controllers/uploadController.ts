import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Invalid file type: Only PDF allowed'));
  }
});

export const parseResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file required' });
    
    const parsedPdf = await pdfParse(req.file.buffer);
    res.status(200).json({
      fileName: req.file.originalname,
      content: parsedPdf.text.trim()
    });
  } catch (err) {
    res.json([]);
  }
};

export const uploadMiddleware = upload.single('resume');