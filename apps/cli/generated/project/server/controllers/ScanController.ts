import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { AnalysisService } from '../services/AnalysisService';

export class ScanController {
  public static async processScan(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || !('resume' in req.files) || !('jobDescription' in req.files)) {
        res.status(400).json({ error: 'Both Resume and Job Description are required' });
        return;
      }

      const resumeBuffer = (req.files as any).resume[0].buffer;
      const jdBuffer = (req.files as any).jobDescription[0].buffer;

      const resumeData = await pdfParse(resumeBuffer);
      const jdData = await pdfParse(jdBuffer);

      const result = AnalysisService.analyze(resumeData.text, jdData.text);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.json([]);
    }
  }
}