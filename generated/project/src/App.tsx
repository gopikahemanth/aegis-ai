import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardSummary } from './components/DashboardSummary';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskManager } from './components/TaskManager';
import { HabitTracker } from './components/HabitTracker';
import { SessionLog } from './components/SessionLog';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { SettingsView } from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { StudySession, Task, Habit, Subject, UserSettings } from './types';

const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Coding', color: '#6366f1' },
  { id: '2', name: 'Mathematics', color: '#10b981' },
  { id: '3', name: 'Design', color: '#ec4899' },
  { id: '4', name: 'Languages', color: '#f59e0b' },
];

const INITIAL_SETTINGS: UserSettings = {
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  soundEnabled: true,
  soundVolume: 0.5,
  dailyGoalMinutes: 120,
  userName: 'Scholar',
};

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Complete React TypeScript Architecture module', completed: false, subjectId: '1', estimatedPomodoros: 3, completedPomodoros: 1, priority: 'high' },
  { id: '2', title: 'Solve 5 calculus differential equations', completed: false, subjectId: '2', estimatedPomodoros: 2, completedPomodoros: 2, priority: 'medium' },
];

const INITIAL_HABITS: Habit[] = [
  { id: '1', title: 'Morning Review & Planning', streak: 5, completedDates: [] },
  { id: '2', title: 'Read 15 pages of technical book', streak: 3, completedDates: [] },
];

const INITIAL_SESSIONS: StudySession[] = [
  { id: '1', subjectId: '1', duration: 25, timestamp: Date.now() - 3600000 * 3, type: 'focus', notes: 'Setup core boilerplate' },
  { id: '2', subjectId: '2', duration: 25, timestamp: Date.now() - 3600000 * 2, type: 'focus', notes: 'Calculus practice' },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [settings, setSettings] = useLocalStorage<UserSettings>('studyflow_settings', INITIAL_SETTINGS);
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('studyflow_subjects', INITIAL_SUBJECTS);
  const [tasks, setTasks] = useLocalStorage<Task[]>('studyflow_tasks', INITIAL_TASKS);
  const [habits, setHabits] = useLocalStorage<Habit[]>('studyflow_habits', INITIAL_HABITS);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>('studyflow_sessions', INITIAL_SESSIONS);

  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id || '1');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const handleAddSession = useCallback((newSession: Omit<StudySession, 'id'>) => {
    const sessionWithId: StudySession = {
      ...newSession,
      id: Math.random().toString(36).substring(2, 9),
    };
    setSessions((prev) => [...prev, sessionWithId]);

    if (activeTaskId && newSession.type === 'focus') {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeTaskId) {
            const nextPomos = t.completedPomodoros + 1;
            return {
              ...t,
              completedPomodoros: nextPomos,
              completed: nextPomos >= t.estimatedPomodoros ? true : t.completed,
            };
          }
          return t;
        })
      );
    }
  }, [activeTaskId, setSessions, setTasks]);

  const timer = usePomodoroTimer({
    settings,
    onSessionComplete: handleAddSession,
    activeSubjectId,
  });

  // Calculate streak based on daily session activity
  const streak = useMemo(() => {
    let currentStreak = 0;
    const focusSessions = sessions.filter((s) => s.type === 'focus');
    if (focusSessions.length === 0) return 0;

    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // check backwards day by day
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toDateString();
      const hasSession = focusSessions.some((s) => new Date(s.timestamp).toDateString() === dateStr);
      if (hasSession) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Allow today to be missing if no session yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(currentStreak, 1);
  }, [sessions]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completedPomodoros'>) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(2, 9),
      completedPomodoros: 0,
    };
    setTasks((prev) => [...prev, task]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const handleToggleHabit = (id: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const exists = h.completedDates.includes(dateStr);
          const newDates = exists ? h.completedDates.filter((d) => d !== dateStr) : [...h.completedDates, dateStr];
          return { ...h, completedDates: newDates, streak: newDates.length };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (title: string) => {
    const habit: Habit = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      streak: 0,
      completedDates: [],
    };
    setHabits((prev) => [...prev, habit]);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const handleAddSubject = (subject: Omit<Subject, 'id'>) => {
    const sub: Subject = {
      ...subject,
      id: Math.random().toString(36).substring(2, 9),
    };
    setSubjects((prev) => [...prev, sub]);
  };

  const handleDeleteSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (activeSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id);
      setActiveSubjectId(remaining[0]?.id || '1');
    }
  };

  const handleResetData = () => {
    setSettings(INITIAL_SETTINGS);
    setSubjects(INITIAL_SUBJECTS);
    setTasks(INITIAL_TASKS);
    setHabits(INITIAL_HABITS);
    setSessions(INITIAL_SESSIONS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased pb-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} streak={streak} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <DashboardSummary
              sessions={sessions}
              tasks={tasks}
              habits={habits}
              dailyGoalMinutes={settings.dailyGoalMinutes}
              userName={settings.userName}
              onNavigatePomodoro={() => setActiveTab('pomodoro')}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TaskManager
                tasks={tasks}
                subjects={subjects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
              <HabitTracker
                habits={habits}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            </div>
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <div className="animate-fadeIn">
            <PomodoroTimer
              mode={timer.mode}
              timeLeft={timer.timeLeft}
              totalDuration={timer.totalDuration}
              isRunning={timer.isRunning}
              pomodoroCount={timer.pomodoroCount}
              subjects={subjects}
              activeSubjectId={activeSubjectId}
              setActiveSubjectId={setActiveSubjectId}
              tasks={tasks}
              activeTaskId={activeTaskId}
              setActiveTaskId={setActiveTaskId}
              onSwitchMode={timer.switchMode}
              onStart={timer.startTimer}
              onPause={timer.pauseTimer}
              onReset={timer.resetTimer}
              onSkip={timer.skipTimer}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fadeIn space-y-12">
            <AnalyticsCharts sessions={sessions} subjects={subjects} />
            <SessionLog
              sessions={sessions}
              subjects={subjects}
              onAddSession={handleAddSession}
              onDeleteSession={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fadeIn">
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              subjects={subjects}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetData={handleResetData}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;