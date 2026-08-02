export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documentSource?: string;
}

export interface ChatSession {
  id: string;
  sessionId?: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}