import React from 'react';
import { TaskList } from '../components/TaskList';
import { useTasks } from '../hooks/useTasks';

export const TasksPage: React.FC = () => {
  const { tasks, addTask, toggleTaskCompletion, deleteTask, incrementTaskPomodoro } = useTasks();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Task Management</h2>
        <p className="text-xs text-slate-400 mt-1">Organize, categorize, and execute your objectives with precision.</p>
      </div>

      <TaskList
        tasks={tasks}
        onAddTask={addTask}
        onToggle={toggleTaskCompletion}
        onDelete={deleteTask}
        onIncrementPomodoro={incrementTaskPomodoro}
      />
    </div>
  );
};