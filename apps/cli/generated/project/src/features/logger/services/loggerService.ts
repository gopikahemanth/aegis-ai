import { Exercise, WorkoutLog } from '../../../entities/fitness';

export async function fetchAvailableExercises(): Promise<Exercise[]> {
  const response = await fetch('/api/exercises');
  if (!response.ok) {
    throw new Error('Failed to fetch exercises');
  }
  return response.json();
}

export async function saveWorkoutSession(payload: {
  workoutName: string;
  startTime: string;
  endTime: string;
  notes: string;
  exercises: { exerciseId: string; sets: { setNumber: number; weight: number; reps: number; rpe?: number; completed: boolean }[] }[];
}): Promise<WorkoutLog> {
  const response = await fetch('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save workout session');
  }

  return response.json();
}