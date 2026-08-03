import React, { useEffect, useState } from 'react';
import { Search, Plus, Dumbbell, X } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../../design-system/index';
import { Exercise } from '../../entities/fitness';
import { fetchExercises, createExercise } from './services/exerciseService';

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

export const ExerciseLibraryPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New exercise form state
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Strength');
  const [muscleGroup, setMuscleGroup] = useState<string>('Chest');
  const [equipment, setEquipment] = useState<string>('Barbell');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExercises(search, selectedMuscle);
      setExercises(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [search, selectedMuscle]);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !muscleGroup || !equipment) return;

    try {
      setSubmitting(true);
      await createExercise({ name, category, muscleGroup, equipment, description });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      loadExercises();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-md shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Exercise Library</h1>
          <p className="text-sm text-slate-400 mt-0.5">Browse comprehensive muscle movements or create custom exercises.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Exercise
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            aria-label="Search exercises"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {muscleGroups.map((mg) => (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                selectedMuscle === mg
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800',
              ].join(' ')}
            >
              {mg}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900 rounded-md p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Exercise Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-12 h-12" />}
          title="No exercises found"
          description="Try adjusting your search query or muscle filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-md p-5 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-slate-100">{ex.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-md">
                    {ex.muscleGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{ex.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-medium">
                <span>Category: <strong className="text-slate-200">{ex.category}</strong></span>
                <span>Equipment: <strong className="text-slate-200">{ex.equipment}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-md max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-100">Create Custom Exercise</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Press"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Muscle Group</label>
                  <select
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Equipment</label>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Barbell">Barbell</option>
                    <option value="Dumbbell">Dumbbell</option>
                    <option value="Machine">Machine</option>
                    <option value="Cable">Cable</option>
                    <option value="Bodyweight">Bodyweight</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief execution notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Save Exercise
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibraryPage;