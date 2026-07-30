import React, { useState } from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIncrementPomodoro: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onToggle,
  onDelete,
  onIncrementPomodoro
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                          task.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search tasks by title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="🔍"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs px-3 py-3 focus:outline-none focus:border-indigo-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Study">Study</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
          </select>

          <select
            className="bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs px-3 py-3 focus:outline-none focus:border-indigo-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <Button variant="primary" onClick={() => setIsModalOpen(true)} icon="+" size="md">
            New Task
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <span className="text-4xl">📭</span>
          <h3 className="text-base font-bold text-slate-200">No tasks found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Try adjusting your search filters or create a new task to get started on your goals.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)} className="mt-2">
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onIncrementPomodoro={onIncrementPomodoro}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <TaskForm onSubmit={onAddTask} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};