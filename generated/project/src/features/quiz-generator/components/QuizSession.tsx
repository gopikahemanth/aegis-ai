import React, { useState } from 'react';
import { Quiz, QuizAttempt } from '../../../entities/Quiz';
import { Card, Button, Badge } from '../../../design-system';

interface QuizSessionProps {
  quiz: Quiz;
  onBack: () => void;
  onSubmitAttempt: (quizId: string, answers: Record<string, number>) => Promise<QuizAttempt>;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ quiz, onBack, onSubmitAttempt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);

  const currentQuestion = quiz.questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await onSubmitAttempt(quiz.id, selectedAnswers);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const percent = result.scorePercent ?? (result.score !== undefined ? result.score : Math.round(((result.correctAnswers ?? 0) / result.totalQuestions) * 100));
    return (
      <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto">
        <Card className="flex flex-col items-center gap-6 p-8 bg-gradient-to-b from-indigo-950/60 to-slate-900/60 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl">
            🏆
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Quiz Completed!</h1>
            <p className="text-sm text-slate-400">You completed <strong>{quiz.title}</strong></p>
          </div>
          <div className="flex items-center justify-center gap-6 py-4 px-8 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">Score</span>
              <span className="text-3xl font-bold text-indigo-400">{percent}%</span>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">Correct</span>
              <span className="text-3xl font-bold text-emerald-400">{result.correctAnswers ?? 0} / {result.totalQuestions}</span>
            </div>
          </div>
          <Button variant="primary" onClick={onBack}>
            Back to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Exit Quiz
        </Button>
        <Badge variant="info">Question {currentIndex + 1} of {quiz.questions.length}</Badge>
      </div>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{quiz.topic}</span>
          <h2 className="text-xl font-semibold text-slate-100">{currentQuestion.question}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQuestion.id] === idx;
            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={[
                  'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-100'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300',
                ].join(' ')}
              >
                <div className={['w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border', isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400'].join(' ')}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm font-medium">{option}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0}>
            Previous
          </Button>
          {currentIndex < quiz.questions.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Next Question
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              Submit Quiz
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};