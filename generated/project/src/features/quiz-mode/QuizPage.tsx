import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Deck, Card } from '../../entities/flashcard';
import { apiClient } from '../../services/apiClient';
import { Button } from '../../design-system/index';
import { ArrowLeft, RotateCw, CheckCircle2, XCircle, Award, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!deckId) return;
    apiClient.getDeckById(deckId).then(fetched => {
      if (fetched) {
        setDeck(fetched);
        if (fetched.cards.length === 0) {
          setError('This deck has no flashcards to quiz.');
        }
      } else {
        setError('Deck not found');
      }
      setLoading(false);
    }).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to load deck for quiz');
      setLoading(false);
    });
  }, [deckId]);

  // Timer effect
  useEffect(() => {
    if (!isFinished && !loading && deck && deck.cards.length > 0) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, loading, deck]);

  const handleAnswer = async (correct: boolean) => {
    if (!deck) return;
    const nextCorrect = correct ? correctCount + 1 : correctCount;
    const nextIncorrect = !correct ? incorrectCount + 1 : incorrectCount;

    if (correct) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    if (currentIndex + 1 < deck.cards.length) {
      setCorrectCount(nextCorrect);
      setIncorrectCount(nextIncorrect);
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Quiz completed
      setCorrectCount(nextCorrect);
      setIncorrectCount(nextIncorrect);
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const total = deck.cards.length;
      const score = Math.round((nextCorrect / total) * 100);

      try {
        await apiClient.saveQuizSession({
          deckId: deck.id,
          userId: 'user-1',
          score,
          totalCards: total,
          correctCount: nextCorrect,
          incorrectCount: nextIncorrect,
          durationSeconds: secondsElapsed,
          completedAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        // silent fail on metric persistence if offline
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setSecondsElapsed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-10 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Preparing quiz session...</div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-10 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-md p-6 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">Quiz Error</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'Deck not available.'}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const cards: Card[] = deck.cards;
  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Exit quiz"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/')}
            >
              Exit
            </Button>
            <div>
              <h1 className="text-base font-semibold text-white">{deck.title}</h1>
              <p className="text-xs text-slate-400">Interactive Quiz Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s
            </span>
          </div>
        </header>

        {isFinished ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-md p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Quiz Completed!</h2>
              <p className="text-sm text-slate-400">You successfully reviewed all cards in this deck.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto py-4">
              <div className="bg-slate-950 border border-slate-800 rounded-md p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{Math.round((correctCount / cards.length) * 100)}%</div>
                <div className="text-xs text-slate-500 mt-1">Final Score</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-md p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{correctCount}</div>
                <div className="text-xs text-slate-500 mt-1">Correct</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-md p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{incorrectCount}</div>
                <div className="text-xs text-slate-500 mt-1">Incorrect</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="secondary"
                icon={<RotateCw className="w-4 h-4" />}
                onClick={restartQuiz}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard Box */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-slate-900/60 border border-slate-800 rounded-md p-8 min-h-[320px] flex flex-col justify-between cursor-pointer hover:border-slate-700 transition shadow-lg group relative"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>{isFlipped ? 'ANSWER (Click to flip back)' : 'QUESTION (Click to flip)'}</span>
                <span className="text-blue-400">Flip card</span>
              </div>

              <div className="py-8 text-center">
                <div className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>
                {currentCard.hints && !isFlipped && showHint && (
                  <div className="mt-6 p-3 rounded-md bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs inline-flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Hint: {currentCard.hints}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-500">
                <div>
                  {currentCard.hints && !isFlipped && !showHint && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      Show Hint
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Interactive Session</span>
                </div>
              </div>
            </div>

            {/* Answer Control Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="danger"
                size="lg"
                icon={<XCircle className="w-5 h-5" />}
                onClick={() => handleAnswer(false)}
              >
                Incorrect / Hard
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={<CheckCircle2 className="w-5 h-5" />}
                onClick={() => handleAnswer(true)}
              >
                Correct / Knew It
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="max-w-3xl mx-auto w-full pt-8 text-center text-xs text-slate-600">
        Flashcard Hub Engine • Strict TypeScript & Vercel Design System
      </footer>
    </div>
  );
};