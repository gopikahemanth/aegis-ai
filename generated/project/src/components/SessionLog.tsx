import React, { useState } from 'react';
import { Plus, Trash2, Clock, CheckCircle2, ListTodo as ListTodoIcon } from 'lucide-react';
import { StudySession, Subject } from '../types';

interface SessionLogProps {
  sessions: StudySession[];
  subjects: Subject[];
  onAddSession: (session: Omit<StudySession, 'id'>) => void;
  onDeleteSession: (id: string) => void;
}

export const SessionLog: React.FC<SessionLogProps> = ({
  sessions,
  subjects,
  onAddSession,
  onDeleteSession,
}) => {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [duration, setDuration] = useState('25');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'focus' | 'break'>('focus');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) return;

    onAddSession({
      subjectId: subjectId || subjects[0]?.id || '1',
      duration: durationNum,
      timestamp: Date.now(),
      type,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    setDuration('25');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodoIcon className="w-6 h-6 text-indigo-400" />
            Session History & Manual Log
          </h2>
          <p className="text-slate-400 text-sm">Track your past study blocks and log sessions manually.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Log New Session
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('focus')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    type === 'focus'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Focus
                </button>
                <button
                  type="button"
                  onClick={() => setType('break')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    type === 'break'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Break
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Session
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Session History ({sessions.length})
          </h3>

          <div className="flex-1 overflow-x-auto">
            {sessions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mb-2 stroke-1 opacity-40" />
                <p>No study sessions logged yet.</p>
                <p className="text-sm">Complete a Pomodoro timer or add one manually on the left.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-4">Subject</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Duration</th>
                    <th className="pb-3 px-4">Date & Time</th>
                    <th className="pb-3 px-4">Notes</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {sessions
                    .slice()
                    .reverse()
                    .map((session) => {
                      const subject = subjects.find((s) => s.id === session.subjectId);
                      return (
                        <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: subject?.color || '#6366f1' }}
                              />
                              {subject?.name || 'General'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.type === 'focus'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {session.type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-300 font-mono">{session.duration}m</td>
                          <td className="py-4 px-4 text-slate-400 text-xs">
                            {new Date(session.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-4 px-4 text-slate-400 max-w-xs truncate">
                            {session.notes || <span className="text-slate-600 italic">No notes</span>}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => onDeleteSession(session.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};