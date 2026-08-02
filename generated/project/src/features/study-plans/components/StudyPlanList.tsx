import React, { useState } from 'react';
import { StudyPlan } from '../../../entities/StudyPlan';
import { Card, Button, Badge, Modal, Input, EmptyState } from '../../../design-system';

interface StudyPlanListProps {
  plans: StudyPlan[];
  onGeneratePlan: (topic: string, goal: string, difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert', days: number) => Promise<void>;
  onSelectPlan: (plan: StudyPlan) => void;
}

export const StudyPlanList: React.FC<StudyPlanListProps> = ({ plans, onGeneratePlan, onSelectPlan }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !goal) return;
    setLoading(true);
    try {
      await onGeneratePlan(topic, goal, difficulty, days);
      setIsModalOpen(false);
      setTopic('');
      setGoal('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-100">Personalized Study Plans</h1>
          <p className="text-sm text-slate-400">AI-tailored curricula mapped to your goals and timeline.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Generate Study Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No study plans created yet"
          description="Generate your first AI curriculum to start tracking your learning milestones."
          actionLabel="Generate Study Plan"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} className="flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-500/50" onClick={() => onSelectPlan(plan)}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="info">{plan.difficulty}</Badge>
                  <span className="text-xs text-slate-400">{plan.totalDurationDays} Days</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{plan.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{plan.goal}</p>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-200">{plan.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${plan.progressPercent}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate AI Study Plan">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Subject or Topic"
            placeholder="e.g., Quantum Physics, Machine Learning, Organic Chemistry"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            required
          />
          <Input
            label="Study Goal"
            placeholder="e.g., Pass final exam with A grade, Understand neural networks"
            value={goal}
            onChange={e => setGoal(e.target.value)}
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
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Generate Curriculum
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};