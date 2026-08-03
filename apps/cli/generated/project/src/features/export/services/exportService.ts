import { jsPDF } from 'jspdf';
import { Note } from '../../../entities';

export const exportService = {
  exportAsMarkdown(note: Note) {
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.md`;
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
    this.downloadBlob(blob, filename);
  },

  exportAsTxt(note: Note) {
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.txt`;
    const textContent = `${note.title.toUpperCase()}\n\n${note.content}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(blob, filename);
  },

  exportAsJson(note: Note) {
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.json`;
    const jsonContent = JSON.stringify(note, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, filename);
  },

  exportAsPdf(note: Note) {
    const doc = new jsPDF();
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.pdf`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(note.title || 'Untitled Note', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Last updated: ${new Date(note.updatedAt).toLocaleString()}`, 14, 28);

    if (note.tags && note.tags.length > 0) {
      const tagString = `Tags: ${note.tags.map((t) => t.name).join(', ')}`;
      doc.text(tagString, 14, 34);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    const cleanContent = note.content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '[Code Block]');

    const splitText = doc.splitTextToSize(cleanContent, 180);
    doc.text(splitText, 14, 46);

    doc.save(filename);
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};