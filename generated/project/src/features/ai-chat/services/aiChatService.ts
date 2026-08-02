import { ChatSession, ChatMessage } from '../../../entities/ChatMessage';
import { StudyMaterial } from '../../../entities/StudyMaterial';

export const aiChatService = {
  getSessions(userId: string): ChatSession[] {
    const raw = localStorage.getItem(`chat_sessions_${userId}`);
    if (!raw) {
      const defaultSession: ChatSession = {
        id: 'sess_default',
        sessionId: 'sess_default',
        title: 'General Study & Vector RAG',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_init',
            sessionId: 'sess_default',
            role: 'assistant',
            content: 'Hello! I am your AI study assistant. Ask me anything about your uploaded study materials, request concept explanations, or practice quiz questions.',
            timestamp: new Date().toISOString(),
          }
        ],
      };
      return [defaultSession];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSessions(userId: string, sessions: ChatSession[]): void {
    localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(sessions));
  },

  getMaterials(userId: string): StudyMaterial[] {
    const raw = localStorage.getItem(`study_materials_${userId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveMaterial(userId: string, material: StudyMaterial): void {
    const materials = this.getMaterials(userId);
    localStorage.setItem(`study_materials_${userId}`, JSON.stringify([material, ...materials]));
  },

  async sendMessage(userId: string, sessionId: string, prompt: string): Promise<{ session: ChatSession; reply: ChatMessage }> {
    const sessions = this.getSessions(userId);
    let session = sessions.find(s => s.id === sessionId || s.sessionId === sessionId);
    if (!session) {
      session = {
        id: sessionId,
        sessionId: sessionId,
        title: prompt.slice(0, 30) + '...',
        createdAt: new Date().toISOString(),
        messages: [],
      };
      sessions.unshift(session);
    }

    const currentSession: ChatSession = session;

    const userMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sessionId: currentSession.id,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    currentSession.messages.push(userMessage);

    // Simulated RAG and AI tutor response generation
    const materials = this.getMaterials(userId);
    let matchedSource: string | undefined = undefined;
    let replyContent = `That is an excellent question regarding "${prompt}". Based on your study curriculum and foundational principles, this concept requires understanding the core interaction between system components, maintaining rigorous active recall, and practicing structured problem-solving.`;

    if (materials.length > 0) {
      const matchedMaterial = materials[0];
      matchedSource = matchedMaterial.filename;
      replyContent = `[Retrieved from vector index of ${matchedMaterial.filename}] Analyzing your notes: "${prompt}" connects directly to the core principles outlined in your uploaded document. Specifically, ensure you review the primary definitions and execute practice problems to reinforce retention.`;
    }

    const assistantMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sessionId: currentSession.id,
      role: 'assistant',
      content: replyContent,
      timestamp: new Date().toISOString(),
      documentSource: matchedSource,
    };

    currentSession.messages.push(assistantMessage);
    if (currentSession.title === 'New Study Session' && currentSession.messages.length <= 3) {
      currentSession.title = prompt.slice(0, 30) + '...';
    }

    this.saveSessions(userId, sessions);
    return { session: currentSession, reply: assistantMessage };
  }
};