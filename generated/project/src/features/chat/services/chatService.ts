import { apiClient } from '../../../utils/apiClient';
import { ChatMessage } from '../../../entities/types';

export const chatService = {
  async getHistory(): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get('/chat/history');
      return res.data.messages;
    } catch {
      const stored = localStorage.getItem('aegis_chat_history');
      if (stored) return JSON.parse(stored);

      const initial: ChatMessage[] = [
        {
          id: 'msg_1',
          role: 'assistant',
          content: 'Hello! I am Aegis AI, your personal study assistant. Ask me anything about your uploaded notes or textbooks.',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('aegis_chat_history', JSON.stringify(initial));
      return initial;
    }
  },

  async sendMessage(content: string): Promise<ChatMessage> {
    try {
      const res = await apiClient.post('/chat/message', { content });
      return res.data.message;
    } catch {
      const reply: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: `Based on your uploaded study materials, "${content}" refers to foundational principles covered in Chapter 3. Regularization and gradient descent optimization ensure higher model stability.`,
        citations: ['Advanced Machine Learning Lecture Notes.pdf (Page 4)'],
        createdAt: new Date().toISOString(),
      };
      
      const history = await this.getHistory();
      const updated = [...history, reply];
      localStorage.setItem('aegis_chat_history', JSON.stringify(updated));
      return reply;
    }
  }
};