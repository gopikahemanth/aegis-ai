import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  score: number;
  matched: string[];
  missing: string[];
  timestamp: string;
}

export const generateAnalysisReport = (data: ExportData) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Resume Analysis Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Match Score: ${data.score}%`, 14, 30);
  doc.text(`Generated on: ${data.timestamp}`, 14, 37);

  autoTable(doc, {
    startY: 45,
    head: [['Category', 'Keywords']],
    body: [
      ['Matched', data.matched.join(', ') || 'None'],
      ['Missing', data.missing.join(', ') || 'None'],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
  });

  doc.save(`analysis-report-${new Date().getTime()}.pdf`);
};