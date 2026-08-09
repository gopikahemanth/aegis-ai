import { Request, Response } from 'express';
import pdf from 'pdf-parse';
import { analyzeResumeContent } from '../utils/nlpEngine';
import { prisma } from '../index';

export const processSubmission = async (req: Request, res: Response) => {
  const { jobDescription } = req.body;
  if (!req.file || !jobDescription) return res.status(400).json({ error: 'Missing files or description' });

  try {
    const data = await pdf(req.file.buffer);
    const analysis = analyzeResumeContent(data.text, jobDescription);

    const submission = await prisma.submission.create({
      data: {
        userId: (req as any).user.id,
        resumeText: data.text,
        jobDescriptionText: jobDescription,
        result: { create: analysis }
      },
      include: { result: true }
    });

    res.json(submission);
  } catch (error) {
    res.json([]);
  }
};