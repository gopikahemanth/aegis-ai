import React from 'react';
import { Task } from '../types';
import { Button } from './Button';
import { Dropdown } from './Dropdown';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIncrementPomodoro: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onIncrementPomodoro }) => {
  const priorityColors = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  const categoryColors = {
    Work: 'text-indigo-400 bg-indigo-500/10',
    Personal: 'text-emerald-400 bg-emerald-500/10',
    Study: 'text-violet-400 bg-violet-500/10',
    Health: 'text-rose-400 bg-rose-500/10',
    Finance: 'text-amber-400 bg-amber-500/10'
  };

  return (
    <div className={`group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col gap-3 backdrop-blur-sm ${task.completed ? 'opacity-60 bg-slate-900/30' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mt-1 h-5 w-5 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
          />
          <div className="min-w-0">
            <h4 className={`font-bold text-sm text-slate-100 truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
              ⋮
            </Button>
          }
          items={[
            {
              label: 'Delete Task',
              danger: true,
              onClick: () => onDelete(task.id)
            }
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg font-medium border ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
          <span className={`px-2.5 py-1 rounded-lg font-medium ${categoryColors[task.category]}`}>
            {task.category}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            📅 {task.dueDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onIncrementPomodoro(task.id)}
            title="Add completed pomodoro"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all font-medium"
          >
            🍅 {task.completedPomodoros} / {task.estimatedPomodoros}
          </button>
        </div>
      </div>
    </div>
  );
};