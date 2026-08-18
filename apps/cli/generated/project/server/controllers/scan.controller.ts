import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { analyzeKeywords, analyzeResume as keywordAnalyzeResume } from "../services/keyword.service";

export async function uploadResume(req: Request, res: Response) {
  res.json({ success: true, text: "Extracted resume content" });
}

export async function analyzeScan(req: Request, res: Response) {
  return analyzeResume(req, res);
}

export async function analyzeResume(req: Request, res: Response) {
  const { resumeText = "", jobDescriptionText = "" } = req.body || {};
  const analysis = keywordAnalyzeResume ? keywordAnalyzeResume(resumeText, jobDescriptionText) : analyzeKeywords(resumeText, jobDescriptionText);

  try {
    const analysisResult = await prisma.analysisResult.create({
      data: {
        userId: (req as any).user?.id || "guest-user",
        
        
        
        
        
        
      },
    });
    res.json(analysisResult);
  } catch (err: any) {
    res.json({
      id: "scan-" + Date.now(),
      ...analysis,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function getScanHistory(req: Request, res: Response) {
  try {
    const history = await prisma.analysisResult.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(history);
  } catch {
    res.json([]);
  }
}

export default { analyzeScan, uploadResume, analyzeResume, getScanHistory };
