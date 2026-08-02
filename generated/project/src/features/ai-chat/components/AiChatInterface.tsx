import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../../../entities/ChatMessage';
import { StudyMaterial } from '../../../entities/StudyMaterial';
import { Card, Button, Input, Badge } from '../../../design-system';
import { aiChatService } from '../services/aiChatService';

interface AiChatInterfaceProps {
  userId: string;
}

export const AiChatInterface: React.FC<AiChatInterfaceProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => aiChatService.getSessions(userId));
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || 'sess_default');
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => aiChatService.getMaterials(userId));
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || {
    id: activeSessionId,
    title: 'New Study Session',
    createdAt: new Date().toISOString(),
    messages: [],
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const res = await aiChatService.sendMessage(userId, activeSessionId, currentPrompt);
      setSessions([...aiChatService.getSessions(userId)]);
      setActiveSessionId(res.session.id);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newMaterial: StudyMaterial = {
        id: 'mat_' + Math.random().toString(36).substring(2, 9),
        userId,
        filename: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'notes',
        fileSize: file.size,
        extractedText: reader.result as string || 'Extracted document content...',
        uploadedAt: new Date().toISOString(),
      };
      aiChatService.saveMaterial(userId, newMaterial);
      setMaterials(aiChatService.getMaterials(userId));
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] animate-fadeIn">
      {/* Sidebar: Sessions & Uploads */}
      <Card className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => {
              const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
              const newSess: ChatSession = { id: newId, title: 'New Study Session', createdAt: new Date().toISOString(), messages: [] };
              const updated = [newSess, ...sessions];
              aiChatService.saveSessions(userId, updated);
              setSessions(updated);
              setActiveSessionId(newId);
            }}
          >
            + New Chat Session
          </Button>

          <label className="flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-slate-700">
            <span>Upload Document / Notes</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.docx,.md" />
          </label>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat History</span>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={[
                'text-left px-3 py-2.5 rounded-lg text-sm transition-all truncate cursor-pointer',
                s.id === activeSessionId
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60',
              ].join(' ')}
            >
              {s.title}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Uploaded Materials ({materials.length})</span>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
            {materials.map(m => (
              <div key={m.id} className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800 truncate">
                <span className="truncate">{m.filename}</span>
                <Badge variant="success">RAG</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="lg:col-span-3 flex flex-col justify-between p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h2 className="text-base font-semibold text-slate-100">{activeSession.title}</h2>
          <Badge variant="info">AI Vector RAG Active</Badge>
        </div>

        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          {activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-slate-400">
              <span className="text-3xl">🤖</span>
              <h3 className="text-base font-semibold text-slate-200">Ask your AI Study Assistant</h3>
              <p className="text-sm max-w-sm">Ask questions, explain complex chapters, or summarize uploaded notes instantly.</p>
            </div>
          ) : (
            activeSession.messages.map(m => (
              <div
                key={m.id}
                className={[
                  'flex flex-col max-w-[80%] gap-1.5 p-4 rounded-xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                    : 'mr-auto bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-bl-none',
                ].join(' ')}
              >
                <span>{m.content}</span>
                {m.documentSource && (
                  <span className="text-[10px] opacity-70 mt-1 pt-1 border-t border-current/20">
                    Source: {m.documentSource}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <Input
            placeholder="Ask a question about your study materials..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" loading={loading}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};