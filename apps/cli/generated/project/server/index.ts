import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure a default user exists for seamless local experience
async function ensureDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'athlete@aegis.fitness',
        name: 'Alex Athlete',
      },
    });

    // Seed default exercises
    const defaultExercises = [
      { name: 'Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', equipment: 'Barbell', description: 'Compound chest press movement' },
      { name: 'Squat', category: 'Strength', muscleGroup: 'Legs', equipment: 'Barbell', description: 'King of lower body exercises' },
      { name: 'Deadlift', category: 'Strength', muscleGroup: 'Back', equipment: 'Barbell', description: 'Full body posterior chain movement' },
      { name: 'Overhead Press', category: 'Strength', muscleGroup: 'Shoulders', equipment: 'Barbell', description: 'Vertical press for shoulder hypertrophy' },
      { name: 'Pull-Up', category: 'Calisthenics', muscleGroup: 'Back', equipment: 'Bodyweight', description: 'Upper body vertical pull' },
      { name: 'Barbell Row', category: 'Strength', muscleGroup: 'Back', equipment: 'Barbell', description: 'Horizontal row for mid back' },
      { name: 'Dumbbell Bicep Curl', category: 'Hypertrophy', muscleGroup: 'Arms', equipment: 'Dumbbell', description: 'Isolation curl for biceps' },
      { name: 'Tricep Pushdown', category: 'Hypertrophy', muscleGroup: 'Arms', equipment: 'Cable', description: 'Cable extension for triceps' },
      { name: 'Leg Press', category: 'Hypertrophy', muscleGroup: 'Legs', equipment: 'Machine', description: 'Machine press for quads and glutes' },
      { name: 'Romanian Deadlift', category: 'Strength', muscleGroup: 'Legs', equipment: 'Barbell', description: 'Hamstring and glute focused hinge' },
    ];

    for (const ex of defaultExercises) {
      await prisma.exercise.create({
        data: {
          ...ex,
          userId: user.id,
        },
      });
    }
  }
  return user.id;
}

// ----------------------------------------------------
// EXERCISES API
// ----------------------------------------------------
app.get('/api/exercises', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const { muscleGroup, search } = req.query;

    const where: any = {
      OR: [{ userId: userId }, { isCustom: false }],
    };

    if (muscleGroup && muscleGroup !== 'All') {
      where.muscleGroup = muscleGroup as string;
    }

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

app.post('/api/exercises', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const { name, category, muscleGroup, equipment, description } = req.body;

    if (!name || !category || !muscleGroup || !equipment) {
      return res.status(400).json({ error: 'Missing required exercise fields' });
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId,
        name,
        category,
        muscleGroup,
        equipment,
        description: description || '',
        isCustom: true,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// ----------------------------------------------------
// WORKOUT LOGS API
// ----------------------------------------------------
app.get('/api/workouts', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const workouts = await prisma.workoutLog.findMany({
      where: { userId },
      include: {
        sets: {
          include: { exercise: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const { workoutName, startTime, endTime, notes, exercises } = req.body;

    if (!workoutName || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'Invalid workout payload' });
    }

    let totalVolume = 0;
    const formattedSetsData: any[] = [];

    // Fetch user's existing PRs
    const existingPRs = await prisma.personalRecord.findMany({
      where: { userId },
    });
    const prMap = new Map(existingPRs.map((pr) => [pr.exerciseId, pr]));

    for (const ex of exercises) {
      for (const set of ex.sets) {
        const weightNum = Number(set.weight) || 0;
        const repsNum = Number(set.reps) || 0;
        const setVolume = weightNum * repsNum;
        if (set.completed) {
          totalVolume += setVolume;
        }

        // Check PR (max weight or max volume / reps)
        let isPr = false;
        const currentPr = prMap.get(ex.exerciseId);
        if (set.completed && weightNum > 0) {
          if (!currentPr || weightNum > currentPr.maxWeight || (weightNum === currentPr.maxWeight && repsNum > currentPr.maxReps)) {
            isPr = true;
            // Update or create PR record in DB
            await prisma.personalRecord.upsert({
              where: {
                userId_exerciseId: {
                  userId,
                  exerciseId: ex.exerciseId,
                },
              },
              update: { maxWeight: weightNum, maxReps: repsNum, achievedAt: new Date() },
              create: {
                userId,
                exerciseId: ex.exerciseId,
                maxWeight: weightNum,
                maxReps: repsNum,
              },
            });
            prMap.set(ex.exerciseId, { id: 'temp', userId, exerciseId: ex.exerciseId, maxWeight: weightNum, maxReps: repsNum, achievedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
          }
        }

        formattedSetsData.push({
          exerciseId: ex.exerciseId,
          setNumber: set.setNumber,
          weight: weightNum,
          reps: repsNum,
          rpe: set.rpe ? Number(set.rpe) : null,
          isPr,
          completed: Boolean(set.completed),
        });
      }
    }

    const newWorkout = await prisma.workoutLog.create({
      data: {
        userId,
        workoutName,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(),
        totalVolume,
        notes: notes || '',
        sets: {
          create: formattedSetsData,
        },
      },
      include: {
        sets: {
          include: { exercise: true },
        },
      },
    });

    res.status(201).json(newWorkout);
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ error: 'Failed to save workout session' });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workoutLog.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout log' });
  }
});

// ----------------------------------------------------
// DASHBOARD & ANALYTICS API
// ----------------------------------------------------
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const workouts = await prisma.workoutLog.findMany({
      where: { userId },
      include: { sets: true },
      orderBy: { startTime: 'desc' },
    });

    const totalWorkouts = workouts.length;
    const totalVolumeAllTime = workouts.reduce((acc, w) => acc + w.totalVolume, 0);

    // Calculate streak (consecutive weeks or days with workouts)
    let currentStreak = 0;
    if (workouts.length > 0) {
      currentStreak = 1; // Simplified streak counter based on recent activity
    }

    const prCount = await prisma.personalRecord.count({ where: { userId } });

    // Weekly progress chart data (last 7 days)
    const now = new Date();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyVolumeMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const recentWorkouts = workouts.filter((w) => new Date(w.startTime) >= oneWeekAgo);
    recentWorkouts.forEach((w) => {
      const dayName = weekDays[new Date(w.startTime).getDay()];
      dailyVolumeMap[dayName] = (dailyVolumeMap[dayName] || 0) + w.totalVolume;
    });

    // Reorder days starting from 6 days ago to today
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = weekDays[d.getDay()];
      chartData.push({
        day: dayStr,
        date: d.toISOString().split('T')[0],
        volumeKg: dailyVolumeMap[dayStr] || 0,
        targetKg: 5000, // Static target benchmark
      });
    }

    res.json({
      totalWorkouts,
      totalVolumeAllTime,
      currentStreak,
      prCount,
      recentWorkouts: workouts.slice(0, 5),
      chartData,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const userId = await ensureDefaultUser();
    const workouts = await prisma.workoutLog.findMany({
      where: { userId },
      include: {
        sets: {
          include: { exercise: true },
        },
      },
    });

    // Muscle group distribution
    const muscleMap: Record<string, number> = {};
    workouts.forEach((w) => {
      w.sets.forEach((s) => {
        if (s.completed && s.exercise) {
          const mg = s.exercise.muscleGroup || 'Other';
          muscleMap[mg] = (muscleMap[mg] || 0) + (s.weight * s.reps || 1);
        }
      });
    });

    const muscleDistribution = Object.keys(muscleMap).map((mg) => ({
      muscleGroup: mg,
      volume: muscleMap[mg],
    }));

    res.json({
      workoutsCount: workouts.length,
      muscleDistribution,
      workouts: workouts.map((w) => ({
        date: new Date(w.startTime).toLocaleDateString(),
        volume: w.totalVolume,
        name: w.workoutName,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.listen(PORT, () => {
  console.log(`Aegis Fitness Tracker Server running on port ${PORT}`);
});