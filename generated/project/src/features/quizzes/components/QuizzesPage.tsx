import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../../../design-system';
import { quizService } from '../services/quizService';
import { Quiz } from '../../../entities/types';
import { formatDate } from '../../../utils/formatDate';

export const QuizzesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizService.getQuizzes();
      setQuizzes(data);
    } catch {
      setError('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setError(null);
    try {
      const newQuiz = await quizService.generateQuiz('doc_1');
      setQuizzes(prev => [newQuiz, ...prev]);
    } catch {
      setError('Failed to generate AI quiz.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Practice Quizzes</h1>
          <p className="text-sm text-slate-400 mt-1">Test your mastery with dynamically generated multiple choice exams.</p>
        </div>
        <Button onClick={handleGenerateQuiz} loading={generating}>
          {generating ? 'AI Generating Exam...' : 'Generate New Quiz'}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes available"
          description="Generate your first practice test based on uploaded study notes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => navigate(`/app/quizzes/${quiz.id}`)}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-xl p-5 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-slate-100 line-clamp-1">{quiz.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                    {quiz.score !== undefined ? `${quiz.score}%` : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{quiz.totalQuestions} multiple choice questions with detailed explanations.</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-500">
                <span>{quiz.completedAt ? 'Completed' : 'Not Started'}</span>
                <span>{formatDate(quiz.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};