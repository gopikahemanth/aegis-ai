import React, { useEffect, useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Trash2, CheckCircle, Clock, Trophy, X, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, EmptyState } from '../../design-system/index';
import { Exercise, WorkoutSet } from '../../entities/fitness';
import { fetchAvailableExercises, saveWorkoutSession } from './services/loggerService';

interface ActiveExerciseItem {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

type WorkoutAction =
  | { type: 'ADD_EXERCISE'; payload: { exerciseId: string; name: string } }
  | { type: 'REMOVE_EXERCISE'; payload: { exerciseId: string } }
  | { type: 'ADD_SET'; payload: { exerciseId: string } }
  | { type: 'UPDATE_SET'; payload: { exerciseId: string; setId: string; weight: number; reps: number; rpe?: number; completed: boolean } }
  | { type: 'REMOVE_SET'; payload: { exerciseId: string; setId: string } }
  | { type: 'RESET_WORKOUT' };

interface WorkoutState {
  workoutName: string;
  exercises: ActiveExerciseItem[];
  startTime: number;
}

const initialWorkoutState: WorkoutState = {
  workoutName: 'Full Body Hypertrophy',
  exercises: [],
  startTime: Date.now(),
};

function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'ADD_EXERCISE':
      if (state.exercises.some((e) => e.exerciseId === action.payload.exerciseId)) return state;
      return {
        ...state,
        exercises: [
          ...state.exercises,
          {
            exerciseId: action.payload.exerciseId,
            name: action.payload.name,
            sets: [{ id: Math.random().toString(), setNumber: 1, weight: 0, reps: 0, completed: false }],
          },
        ],
      };
    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.exerciseId !== action.payload.exerciseId),
      };
    case 'ADD_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          const nextSetNumber = ex.sets.length + 1;
          return {
            ...ex,
            sets: [
              ...ex.sets,
              { id: Math.random().toString(), setNumber: nextSetNumber, weight: 0, reps: 0, completed: false },
            ],
          };
        }),
      };
    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === action.payload.setId
                ? { ...set, weight: action.payload.weight, reps: action.payload.reps, rpe: action.payload.rpe, completed: action.payload.completed }
                : set
            ),
          };
        }),
      };
    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== action.payload.exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((set) => set.id !== action.payload.setId),
          };
        }),
      };
    case 'RESET_WORKOUT':
      return { ...initialWorkoutState, startTime: Date.now() };
    default:
      return state;
  }
}

export const ActiveWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(workoutReducer, initialWorkoutState, (init) => {
    const saved = localStorage.getItem('active_workout_session');
    return saved ? JSON.parse(saved) : init;
  });

  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('active_workout_session', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - state.startTime) / 1000);
      setElapsedSeconds(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.startTime]);

  useEffect(() => {
    fetchAvailableExercises()
      .then(setExercisesList)
      .catch((err) => setError(err.message));
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = async () => {
    if (state.exercises.length === 0) {
      setError('Please add at least one exercise before completing workout.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await saveWorkoutSession({
        workoutName: state.workoutName,
        startTime: new Date(state.startTime).toISOString(),
        endTime: new Date().toISOString(),
        notes,
        exercises: state.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            weight: Number(s.weight),
            reps: Number(s.reps),
            rpe: s.rpe ? Number(s.rpe) : undefined,
            completed: s.completed,
          })),
        })),
      });

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      localStorage.removeItem('active_workout_session');
      navigate('/history');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header & Timer Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="w-full sm:w-auto">
          <input
            type="text"
            aria-label="Workout Name"
            value={state.workoutName}
            onChange={(e) => dispatch({ type: 'RESET_WORKOUT' })} // simplified or custom handler
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-lg font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
          <p className="text-xs text-slate-400 mt-1">Log your sets, weights, and reps in real-time.</p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-md">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-slate-200">{formatTime(elapsedSeconds)}</span>
          </div>

          <Button
            variant="primary"
            onClick={handleFinishWorkout}
            loading={submitting}
            icon={<Save className="w-4 h-4" />}
          >
            Finish Workout
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900 rounded-md p-4 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Exercises Log Container */}
      {state.exercises.length === 0 ? (
        <EmptyState
          icon={<Play className="w-12 h-12" />}
          title="No exercises added to this workout"
          description="Add exercises from your library to start logging sets."
          action={
            <Button variant="primary" onClick={() => setIsPickerOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Exercise
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {state.exercises.map((ex) => (
            <div key={ex.exerciseId} className="bg-slate-900 border border-slate-800 rounded-md p-5 shadow-md">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-slate-100">{ex.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${ex.name}`}
                  onClick={() => dispatch({ type: 'REMOVE_EXERCISE', payload: { exerciseId: ex.exerciseId } })}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>

              {/* Sets Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 mb-2 px-1">
                <span className="col-span-2 text-center">SET</span>
                <span className="col-span-4">KG</span>
                <span className="col-span-4">REPS</span>
                <span className="col-span-2 text-center">DONE</span>
              </div>

              {/* Sets Rows */}
              <div className="space-y-2">
                {ex.sets.map((set) => (
                  <div key={set.id} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded-md border border-slate-800/80">
                    <span className="col-span-2 text-center font-mono text-sm font-bold text-slate-400">
                      {set.setNumber}
                    </span>
                    <div className="col-span-4">
                      <input
                        type="number"
                        aria-label={`Weight for set ${set.setNumber}`}
                        value={set.weight || ''}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_SET',
                            payload: {
                              exerciseId: ex.exerciseId,
                              setId: set.id,
                              weight: parseFloat(e.target.value) || 0,
                              reps: set.reps,
                              completed: set.completed,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        aria-label={`Reps for set ${set.setNumber}`}
                        value={set.reps || ''}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_SET',
                            payload: {
                              exerciseId: ex.exerciseId,
                              setId: set.id,
                              weight: set.weight,
                              reps: parseInt(e.target.value, 10) || 0,
                              completed: set.completed,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        aria-label={`Complete set ${set.setNumber}`}
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_SET',
                            payload: {
                              exerciseId: ex.exerciseId,
                              setId: set.id,
                              weight: set.weight,
                              reps: set.reps,
                              completed: !set.completed,
                            },
                          })
                        }
                        className={[
                          'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                          set.completed
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300',
                        ].join(' ')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => dispatch({ type: 'ADD_SET', payload: { exerciseId: ex.exerciseId } })}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Set
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsPickerOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Another Exercise
            </Button>
          </div>
        </div>
      )}

      {/* Workout Notes */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-5">
        <label htmlFor="workout-notes" className="block text-sm font-semibold text-slate-200 mb-2">Workout Notes</label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did session feel? Energy levels, pumps..."
          className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Exercise Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-100">Select Exercise</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsPickerOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {exercisesList.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    dispatch({ type: 'ADD_EXERCISE', payload: { exerciseId: ex.id, name: ex.name } });
                    setIsPickerOpen(false);
                  }}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-md hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200">{ex.name}</h4>
                    <p className="text-xs text-slate-400">{ex.muscleGroup} • {ex.equipment}</p>
                  </div>
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkoutPage;