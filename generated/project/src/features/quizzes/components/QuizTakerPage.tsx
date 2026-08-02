import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../design-system';
import { quizService } from '../services/quizService';
import { QuizQuestion } from '../../../entities/types';

export const QuizTakerPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizService.getQuestions(quizId || 'quiz_1').then(data => {
      setQuestions(data);
      setLoading(false);
    });
  }, [quizId]);

  const handleSelectOption = (optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitted(true);
    await quizService.submitQuiz(quizId || 'quiz_1', selectedAnswers);
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-12">Loading quiz questions...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">No questions found</h2>
        <Button onClick={() => navigate('/app/quizzes')}>Back to Quizzes</Button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/app/quizzes')} className="text-xs text-indigo-400 hover:underline">
          ← Back to Quizzes
        </button>
        <span className="text-xs font-mono text-slate-400">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100">{q.question}</h2>

        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            const isSelected = selectedAnswers[currentIndex] === idx;
            const isCorrect = submitted && q.correctAnswer === idx;
            const isWrong = submitted && isSelected && !isCorrect;

            let borderStyle = 'border-slate-800 hover:border-indigo-500/50';
            if (isSelected) borderStyle = 'border-indigo-500 bg-indigo-500/10';
            if (isCorrect) borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
            if (isWrong) borderStyle = 'border-red-500 bg-red-500/10 text-red-300';

            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all text-sm text-slate-200 ${borderStyle}`}
              >
                {opt}
              </div>
            );
          })}
        </div>

        {submitted && q.explanation && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-400 block mb-1">Explanation:</span>
            {q.explanation}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
        >
          Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(prev => prev + 1)}>
            Next
          </Button>
        ) : !submitted ? (
          <Button onClick={handleSubmitQuiz} variant="primary">
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={() => navigate('/app/quizzes')}>
            Finish & Return
          </Button>
        )}
      </div>
    </div>
  );
};