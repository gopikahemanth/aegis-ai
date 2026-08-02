import React, { useState } from 'react';
import { Quiz } from '../../../entities/Quiz';
import { Card, Button, Badge, Modal, Input, EmptyState } from '../../../design-system';

interface QuizListProps {
  quizzes: Quiz[];
  onGenerateQuiz: (title: string, topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => Promise<void>;
  onStartQuiz: (quiz: Quiz) => void;
}

export const QuizList: React.FC<QuizListProps> = ({ quizzes, onGenerateQuiz, onStartQuiz }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic) return;
    setLoading(true);
    try {
      await onGenerateQuiz(title, topic, difficulty);
      setIsModalOpen(false);
      setTitle('');
      setTopic('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-100">AI Quizzes & Mock Tests</h1>
          <p className="text-sm text-slate-400">Test your mastery with AI-generated interactive assessments.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Generate Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes generated yet"
          description="Create your first quiz to evaluate your knowledge and track your exam readiness."
          actionLabel="Generate Quiz"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <Card key={quiz.id} className="flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-500/50" onClick={() => onStartQuiz(quiz)}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="info">{quiz.difficulty}</Badge>
                  <span className="text-xs text-slate-400">{quiz.questions.length} Questions</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{quiz.title}</h3>
                <p className="text-sm text-slate-400">Topic: {quiz.topic}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Attempts: {quiz.attempts?.length || 0}</span>
                <span className="text-indigo-400 font-medium">Start Test →</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate AI Quiz">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Quiz Title"
            placeholder="e.g., Midterm Practice Exam"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Input
            label="Subject / Topic"
            placeholder="e.g., Data Structures, World History"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Generate Questions
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};