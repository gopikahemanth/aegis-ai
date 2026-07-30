import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Flame, AlertCircle } from 'lucide-react';
import { Task, Subject } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Omit<Task, 'id' | 'completedPomodoros'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  subjects,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState('2');
  const [priority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      subjectId: subjectId || subjects[0]?.id || '1',
      estimatedPomodoros: parseInt(estimatedPomodoros, 10) || 1,
      priority,
      completed: false,
    });

    setTitle('');
    setEstimatedPomodoros('2');
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-indigo-400" />
          Study Tasks & Goals
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {tasks.filter((t) => t.completed).length} / {tasks.length} completed
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <input
            type="text"
            placeholder="What do you need to study or complete?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            required
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <input
            type="number"
            min="1"
            max="20"
            title="Estimated Pomodoros"
            value={estimatedPomodoros}
            onChange={(e) => setEstimatedPomodoros(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="Pomos"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No study tasks added yet.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const subject = subjects.find((s) => s.id === task.subjectId);
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-slate-950/30 border-slate-900 text-slate-500 line-through'
                    : 'bg-slate-950/70 border-slate-800/80 text-white shadow-lg'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button onClick={() => onToggleTask(task.id)} className="text-indigo-400 hover:text-indigo-300 shrink-0">
                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="truncate">
                    <p className={`font-medium truncate ${task.completed ? 'text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {subject && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Flame className="w-3 h-3 text-indigo-400" />
                        {task.completedPomodoros}/{task.estimatedPomodoros} pomos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      task.priority === 'high'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};