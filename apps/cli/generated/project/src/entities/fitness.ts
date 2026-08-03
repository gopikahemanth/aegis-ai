export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  description?: string;
  isCustom: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isPr?: boolean;
  completed: boolean;
  exercise?: Exercise;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  workoutName: string;
  startTime: string;
  endTime?: string;
  totalVolume: number;
  notes?: string;
  sets: (WorkoutSet & { exercise: Exercise })[];
}

export interface DashboardStats {
  totalWorkouts: number;
  totalVolumeAllTime: number;
  currentStreak: number;
  prCount: number;
  recentWorkouts: WorkoutLog[];
  chartData: { day: string; date: string; volumeKg: number; targetKg: number }[];
}

export interface AnalyticsData {
  workoutsCount: number;
  muscleDistribution: { muscleGroup: string; volume: number }[];
  workouts: { date: string; volume: number; name: string }[];
}