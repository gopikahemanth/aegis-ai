export interface StudyMaterial {
  id: string;
  userId: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'image' | 'notes';
  fileSize: number;
  extractedText: string;
  summary?: string;
  uploadedAt: string;
}