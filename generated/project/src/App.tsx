import React, { useState } from 'react';
import { useAuth } from './features/auth/hooks/useAuth';
import { Layout } from './components/Layout';
import { DashboardOverview } from './features/dashboard/components/DashboardOverview';
import { useDashboardStats } from './features/dashboard/hooks/useDashboardStats';
import { studyPlanService } from './features/study-plans/services/studyPlanService';
import { StudyPlanList } from './features/study-plans/components/StudyPlanList';
import { StudyPlanDetail } from './features/study-plans/components/StudyPlanDetail';
import { StudyPlan } from './entities/StudyPlan';
import { flashcardService } from './features/flashcards/services/flashcardService';
import { FlashcardDeckList } from './features/flashcards/components/FlashcardDeckList';
import { FlashcardReview } from './features/flashcards/components/FlashcardReview';
import { FlashcardDeck } from './entities/Flashcard';
import { quizService } from './features/quiz-generator/services/quizService';
import { QuizList } from './features/quiz-generator/components/QuizList';
import { QuizSession } from './features/quiz-generator/components/QuizSession';
import { Quiz } from './entities/Quiz';
import { AiChatInterface } from './features/ai-chat/components/AiChatInterface';
import { SettingsView } from './features/settings/components/SettingsView';
import { LoginPage } from './features/auth/components/LoginPage';
import { RegisterPage } from './features/auth/components/RegisterPage';
import { User } from './entities/User';

export default function App() {
  const { user, isAuthenticated, login, register, logout, updateProfile } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/app/dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Dashboard stats
  const { stats, refresh: refreshStats } = useDashboardStats(user?.id);

  // Study Plan navigation state
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => user ? studyPlanService.getPlans(user.id) : []);

  // Flashcards state
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => user ? flashcardService.getDecks(user.id) : []);

  // Quizzes state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => user ? quizService.getQuizzes(user.id) : []);

  const handleLoginSubmit = async (emailStr: string, passStr: string): Promise<void> => {
    await login(emailStr, passStr);
  };

  const handleRegisterSubmit = async (emailStr: string, passStr: string, nameStr: string): Promise<void> => {
    await register(emailStr, passStr, nameStr);
  };

  if (!isAuthenticated || !user) {
    if (authMode === 'login') {
      return (
        <LoginPage
          onLogin={handleLoginSubmit}
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    }
    return (
      <RegisterPage
        onRegister={handleRegisterSubmit}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  const renderContent = () => {
    if (currentPath === '/app/dashboard') {
      return (
        <DashboardOverview
          user={user}
          stats={stats}
          onNavigate={path => {
            setCurrentPath(path);
            setSelectedPlan(null);
            setSelectedDeck(null);
            setSelectedQuiz(null);
          }}
        />
      );
    }
    if (currentPath === '/app/study-plans') {
      if (selectedPlan) {
        return (
          <StudyPlanDetail
            plan={selectedPlan}
            onBack={() => setSelectedPlan(null)}
            onToggleMilestone={(planId, msId, completed) => {
              const updated = studyPlanService.updatePlanMilestone(user.id, planId, msId, completed);
              setSelectedPlan({ ...updated });
              setStudyPlans(studyPlanService.getPlans(user.id));
              refreshStats();
            }}
          />
        );
      }
      return (
        <StudyPlanList
          plans={studyPlans}
          onGeneratePlan={async (topic, goal, difficulty, days) => {
            await studyPlanService.generatePlan(user.id, topic, goal, difficulty, days);
            setStudyPlans(studyPlanService.getPlans(user.id));
            refreshStats();
          }}
          onSelectPlan={plan => setSelectedPlan(plan)}
        />
      );
    }
    if (currentPath === '/app/flashcards') {
      if (selectedDeck) {
        return (
          <FlashcardReview
            deck={selectedDeck}
            onBack={() => setSelectedDeck(null)}
            onRateCard={(deckId, cardId, quality) => {
              flashcardService.updateCardReview(user.id, deckId, cardId, quality);
              setDecks(flashcardService.getDecks(user.id));
            }}
          />
        );
      }
      return (
        <FlashcardDeckList
          decks={decks}
          onGenerateDeck={async (title, category, topicText) => {
            await flashcardService.generateDeck(user.id, title, category, topicText);
            setDecks(flashcardService.getDecks(user.id));
            refreshStats();
          }}
          onStartReview={deck => setSelectedDeck(deck)}
        />
      );
    }
    if (currentPath === '/app/quizzes') {
      if (selectedQuiz) {
        return (
          <QuizSession
            quiz={selectedQuiz}
            onBack={() => setSelectedQuiz(null)}
            onSubmitAttempt={async (quizId, answers) => {
              return quizService.submitAttempt(user.id, quizId, answers);
            }}
          />
        );
      }
      return (
        <QuizList
          quizzes={quizzes}
          onGenerateQuiz={async (title, topic, difficulty) => {
            await quizService.generateQuiz(user.id, title, topic, difficulty);
            setQuizzes(quizService.getQuizzes(user.id));
          }}
          onStartQuiz={quiz => setSelectedQuiz(quiz)}
        />
      );
    }
    if (currentPath === '/app/ai-chat') {
      return <AiChatInterface userId={user.id} />;
    }
    if (currentPath === '/app/settings') {
      return <SettingsView user={user} onUpdateProfile={(userId: string, data: Partial<User>) => updateProfile(userId, data)} />;
    }
    return <DashboardOverview user={user} stats={stats} onNavigate={setCurrentPath} />;
  };

  return (
    <Layout
      user={user}
      currentPath={currentPath}
      onNavigate={path => {
        setCurrentPath(path);
        setSelectedPlan(null);
        setSelectedDeck(null);
        setSelectedQuiz(null);
      }}
      onLogout={logout}
    >
      {renderContent()}
    </Layout>
  );
}