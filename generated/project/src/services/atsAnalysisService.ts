import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import { AnalysisResult } from '../types';

// pdfjs-dist v4+ requires the worker to be loaded as a module URL.
// Using the legacy CDN string fails silently when version mismatches occur.
// This import resolves the worker file from the installed package via Vite bundler.
if (typeof window !== 'undefined') {
  try {
    // For pdfjs-dist v4+, set workerSrc to the bundled worker from node_modules
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).toString();
  } catch {
    // Fallback: disable worker (uses main thread — slower but always works)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + ' ';
      }
      if (!text.trim()) {
        throw new Error('PDF parsed but extracted no text — the PDF may be scanned/image-based.');
      }
      return text;
    } catch (pdfErr: any) {
      console.warn('[pdfjs] Parse failed, attempting plain text fallback:', pdfErr.message);
      // Last resort: read raw bytes as text (works for text-based PDFs with simple encoding)
      const rawText = await file.text();
      if (rawText.trim().length > 50) return rawText;
      throw new Error(`PDF parsing failed: ${pdfErr.message}. Save your resume as a .txt file and re-upload.`);
    }
  } else if (ext === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      return value;
    } catch (docxErr: any) {
      throw new Error(`DOCX parsing failed: ${docxErr.message}. Try saving as .txt.`);
    }
  } else {
    // Plain text / TXT — always works
    return await file.text();
  }
}


export async function analyzeResumeText(file: File, jobDescription: string): Promise<AnalysisResult> {
  const resumeText = await extractTextFromFile(file);
  const lowerResume = resumeText.toLowerCase();

  const jdWords = Array.from(new Set(
    jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  ));

  const commonStopWords = new Set(['with', 'this', 'that', 'from', 'have', 'your', 'will', 'are', 'our', 'their', 'they', 'about', 'which', 'would', 'the', 'and', 'for', 'you', 'was']);
  const filteredJdWords = jdWords.filter(w => !commonStopWords.has(w));

  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  filteredJdWords.forEach(word => {
    if (lowerResume.includes(word)) {
      foundKeywords.push(word);
    } else {
      missingKeywords.push(word);
    }
  });

  const keywordMatchRatio = filteredJdWords.length > 0 
    ? foundKeywords.length / filteredJdWords.length 
    : 0;

  const keywordScore = Math.round(keywordMatchRatio * 100);
  
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
  const hasPhone = /\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/.test(resumeText);
  const formattingScore = (hasEmail ? 50 : 20) + (hasPhone ? 50 : 20);

  const hasExperienceSection = /experience|employment|work history|professional background/i.test(resumeText);
  const experienceScore = hasExperienceSection ? 85 : 40;

  const hasEducationSection = /education|university|college|degree|bachelor|master|phd/i.test(resumeText);
  const educationScore = hasEducationSection ? 90 : 50;

  const skillKeywords = ['react', 'typescript', 'javascript', 'node', 'python', 'sql', 'tailwind', 'aws', 'docker', 'git', 'html', 'css', 'agile', 'scrum', 'leadership', 'communication'];
  const matchedSkills = skillKeywords.filter(s => lowerResume.includes(s));
  const skillsScore = Math.min(100, Math.max(30, Math.round((matchedSkills.length / Math.max(1, skillKeywords.filter(s => jobDescription.toLowerCase().includes(s)).length || 4)) * 100)));

  const overallScore = Math.round(
    (keywordScore * 0.4) + 
    (skillsScore * 0.25) + 
    (experienceScore * 0.15) + 
    (educationScore * 0.1) + 
    (formattingScore * 0.1)
  );

  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`Incorporate high-priority keywords into your experience bullets: ${missingKeywords.slice(0, 5).join(', ')}.`);
  }
  if (!hasEmail || !hasPhone) {
    recommendations.push('Ensure your contact email and phone number are clearly visible at the top of your resume.');
  }
  if (!hasExperienceSection) {
    recommendations.push('Add a dedicated "Work Experience" section detailing chronological employment history.');
  }
  if (keywordScore < 60) {
    recommendations.push('Tailor your resume phrasing to better mirror the job description terminology.');
  } else {
    recommendations.push('Excellent keyword alignment with the target job posting.');
  }

  const analysisResult: AnalysisResult = {
    fileName: file.name,
    score: Math.max(15, Math.min(100, overallScore)),
    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    categories: {
      keywords: keywordScore,
      skills: skillsScore,
      experience: experienceScore,
      education: educationScore,
      formatting: formattingScore,
    },
    foundKeywords,
    missingKeywords,
    recommendations,
  };

  const existingHistory = JSON.parse(localStorage.getItem('ats_scan_history') || '[]');
  const newHistoryItem = { ...analysisResult, id: Date.now().toString() };
  localStorage.setItem('ats_scan_history', JSON.stringify([newHistoryItem, ...existingHistory]));

  return analysisResult;
}

export function generatePdfReport(result: AnalysisResult) {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('ATS Resume Analysis Report', 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`File Name: ${result.fileName}`, 20, 30);
  doc.text(`Scan Date: ${result.date}`, 20, 38);
  doc.text(`Overall ATS Compatibility Score: ${result.score}%`, 20, 46);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('Score Breakdown', 20, 60);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`- Keywords Match: ${result.categories.keywords}%`, 25, 70);
  doc.text(`- Core Skills Match: ${result.categories.skills}%`, 25, 78);
  doc.text(`- Experience Depth: ${result.categories.experience}%`, 25, 86);
  doc.text(`- Education & Certs: ${result.categories.education}%`, 25, 94);
  doc.text(`- Formatting & Contact: ${result.categories.formatting}%`, 25, 102);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('Top Recommendations', 20, 118);

  result.recommendations.forEach((rec, idx) => {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${idx + 1}. ${rec}`, 25, 128 + (idx * 10));
  });

  doc.save(`${result.fileName}-ats-report.pdf`);
}