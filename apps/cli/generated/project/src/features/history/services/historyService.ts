import { WorkoutLog } from '../../../entities/fitness';

export async function fetchWorkoutHistory(): Promise<WorkoutLog[]> {
  const response = await fetch('/api/workouts');
  if (!response.ok) {
    throw new Error('Failed to fetch workout history');
  }
  return response.json();
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  const response = await fetch(`/api/workouts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete workout log');
  }
}