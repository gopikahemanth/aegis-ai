import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { Note } from '../../../entities';

export function useFuzzySearch(notes: Note[], query: string): Note[] {
  const fuse = useMemo(() => {
    return new Fuse(notes, {
      keys: ['title', 'content', 'tags.name'],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [notes]);

  return useMemo(() => {
    if (!query.trim()) return notes;
    return fuse.search(query).map((result: { item: Note }) => result.item);
  }, [fuse, query, notes]);
}