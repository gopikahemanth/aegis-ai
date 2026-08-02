import React, { useState, useEffect } from 'react';
import { StudyPlan } from '../../../entities/StudyPlan';
import { studyPlanService } from '../services/studyPlanService';
import { useAuth } from '../../auth/hooks/useAuth';
import { StudyPlanList } from './StudyPlanList';
import { StudyPlanDetail } from './StudyPlanDetail';
import { Toast } from '../../../design-system';

export const StudyPlansPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_guest';

  const [plans, setPlans] = useState<StudyPlan[]>(() => studyPlanService.getPlans(userId));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlans(studyPlanService.getPlans(userId));
  }, [userId]);

  const handleGeneratePlan = async (topic: string, goal: string, difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert', days: number) => {
    await studyPlanService.generatePlan(userId, topic, goal, difficulty, days);
    setPlans(studyPlanService.getPlans(userId));
    setToastMessage('Study plan generated successfully!');
  };

  const handleToggleMilestone = (planId: string, milestoneId: string, completed: boolean) => {
    studyPlanService.updatePlanMilestone(userId, planId, milestoneId, completed);
    setPlans(studyPlanService.getPlans(userId));
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleDismissToast = () => {
    setToastMessage(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {toastMessage && (
        <Toast toast={{ id: 'plans_toast', type: 'success', message: toastMessage }} onDismiss={handleDismissToast} />
      )}

      {selectedPlan ? (
        <StudyPlanDetail
          plan={selectedPlan}
          onBack={() => setSelectedPlanId(null)}
          onToggleMilestone={handleToggleMilestone}
        />
      ) : (
        <StudyPlanList
          plans={plans}
          onGeneratePlan={handleGeneratePlan}
          onSelectPlan={plan => setSelectedPlanId(plan.id)}
        />
      )}
    </div>
  );
};