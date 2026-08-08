import { Request, Response } from 'express';
import { Parser } from 'json2csv';
import { jsPDF } from 'jspdf';
import { prisma } from '../lib/prisma';

export const exportScan = async (req: Request, res: Response) => {
  const { scanId, format } = req.params;
  const userId = (req as any).user.id;

  const scan = await prisma.scan.findFirst({
    where: { id: parseInt(scanId), userId },
    include: { resume: true, jobDescription: true }
  });

  if (!scan) return res.status(404).json({ error: 'Scan record not found' });

  if (format === 'csv') {
    const fields = ['id', 'matchScore', 'keywordCoverage', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse([scan]);
    res.header('Content-Type', 'text/csv');
    res.attachment(`analysis-${scan.id}.csv`);
    return res.send(csv);
  }

  if (format === 'pdf') {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Resume Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Scan ID: ${scan.id}`, 20, 40);
    doc.text(`Match Score: ${scan.matchScore}%`, 20, 50);
    doc.text(`Insights: ${scan.aiInsights}`, 20, 70);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.header('Content-Type', 'application/pdf');
    res.attachment(`analysis-${scan.id}.pdf`);
    return res.send(pdfBuffer);
  }

  res.status(400).json({ error: 'Invalid export format' });
};