import React from 'react';
import { StudyPlan } from '../../../entities/StudyPlan';
import { Card, Button, Badge } from '../../../design-system';

interface StudyPlanDetailProps {
  plan: StudyPlan;
  onBack: () => void;
  onToggleMilestone: (planId: string, milestoneId: string, completed: boolean) => void;
}

export const StudyPlanDetail: React.FC<StudyPlanDetailProps> = ({ plan, onBack, onToggleMilestone }) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back to Plans
        </Button>
        <Badge variant="info">{plan.difficulty} • {plan.totalDurationDays} Days</Badge>
      </div>

      <Card className="flex flex-col gap-4 bg-gradient-to-r from-indigo-950/60 to-slate-900/60">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-100">{plan.title}</h1>
          <p className="text-sm text-slate-300"><strong className="text-slate-100">Goal:</strong> {plan.goal}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Completion</span>
            <span className="font-semibold text-slate-200">{plan.progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${plan.progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        {plan.modules.map((mod, modIdx) => (
          <Card key={mod.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Module {modIdx + 1}</span>
              <h3 className="text-lg font-semibold text-slate-100">{mod.title}</h3>
              <p className="text-sm text-slate-400">{mod.summary}</p>
            </div>
            <div className="flex flex-col gap-3">
              {mod.milestones.map(ms => (
                <div
                  key={ms.id}
                  onClick={() => onToggleMilestone(plan.id, ms.id, !ms.completed)}
                  className={[
                    'flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer',
                    ms.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-100',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={ms.completed}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex flex-col gap-1">
                      <span className={['text-sm font-medium', ms.completed ? 'line-through text-slate-400' : ''].join(' ')}>
                        {ms.title}
                      </span>
                      <span className="text-xs text-slate-400">{ms.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="neutral">{ms.dueDate}</Badge>
                    <Badge variant="info">~{ms.estimatedMinutes}m</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};