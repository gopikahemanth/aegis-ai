import React from 'react';
import { WidgetGrid } from '../components/WidgetGrid';
import { TimeTracker } from '../components/TimeTracker';
import { ProductivityChart } from '../components/ProductivityChart';
import { TaskList } from '../components/TaskList';
import { useTasks } from '../hooks/useTasks';

export const DashboardPage: React.FC = () => {
  const { tasks, addTask, toggleTaskCompletion, deleteTask, incrementTaskPomodoro } = useTasks();
  const recentTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Command Center</h2>
        <p className="text-xs text-slate-400 mt-1">Monitor your productivity metrics and active flow sessions.</p>
      </div>

      <WidgetGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TimeTracker />
        <ProductivityChart />
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Recent Priority Tasks</h3>
            <p className="text-xs text-slate-400">Your most urgent objectives needing attention.</p>
          </div>
        </div>
        <TaskList
          tasks={recentTasks}
          onAddTask={addTask}
          onToggle={toggleTaskCompletion}
          onDelete={deleteTask}
          onIncrementPomodoro={incrementTaskPomodoro}
        />
      </div>
    </div>
  );
};