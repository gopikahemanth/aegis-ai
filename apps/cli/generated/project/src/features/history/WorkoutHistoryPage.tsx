import React, { useEffect, useState } from 'react';
import { Calendar, Trash2, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../../design-system/index';
import { WorkoutLog } from '../../entities/fitness';
import { fetchWorkoutHistory, deleteWorkoutLog } from './services/historyService';

export const WorkoutHistoryPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkoutHistory();
      setWorkouts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkoutLog(id);
      setWorkouts(workouts.filter((w) => w.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-md shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Workout History</h1>
        <p className="text-sm text-slate-400 mt-0.5">Inspect past completed sessions, sets, and volume achievements.</p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900 rounded-md p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No past workouts found"
          description="Your completed workout sessions will appear here chronologically."
        />
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => {
            const isExpanded = expandedId === workout.id;
            const isConfirmingDelete = deletingId === workout.id;

            return (
              <div key={workout.id} className="bg-slate-900 border border-slate-800 rounded-md shadow-md overflow-hidden">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{workout.workoutName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(workout.startTime).toLocaleDateString()} • {workout.sets.length} sets logged
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-400">{workout.totalVolume.toLocaleString()} kg</span>
                      <p className="text-xs text-slate-500">Volume</p>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800 space-y-4 bg-slate-950/50">
                    {workout.notes && (
                      <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded-md border border-slate-800">
                        <strong className="text-slate-300">Notes:</strong> {workout.notes}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Sets Breakdown</h4>
                      <div className="space-y-1.5">
                        {workout.sets.map((set, index) => (
                          <div key={set.id || index} className="bg-slate-900 border border-slate-800 p-2.5 rounded-md flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-slate-500 font-bold">#{set.setNumber}</span>
                              <span className="font-semibold text-slate-200">{set.exercise?.name || 'Exercise'}</span>
                            </div>

                            <div className="flex items-center gap-4 font-mono text-xs">
                              <span className="text-slate-300">{set.weight} kg × {set.reps} reps</span>
                              {set.isPr && (
                                <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-sans font-medium">
                                  <Trophy className="w-3 h-3" /> PR
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Confirm deletion?</span>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(workout.id)}>
                            Yes, Delete
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(workout.id)}
                          icon={<Trash2 className="w-4 h-4 text-red-400" />}
                        >
                          Delete Workout
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistoryPage;