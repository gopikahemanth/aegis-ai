import { Exercise } from '../../../entities/fitness';

export async function fetchExercises(search?: string, muscleGroup?: string): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (muscleGroup && muscleGroup !== 'All') params.append('muscleGroup', muscleGroup);

  const response = await fetch(`/api/exercises?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch exercise library');
  }
  return response.json();
}

export async function createExercise(payload: {
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  description: string;
}): Promise<Exercise> {
  const response = await fetch('/api/exercises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create custom exercise');
  }

  return response.json();
}