import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { Note, Notebook, Tag } from '../../../entities';

export function useNotesQuery(params?: { notebookId?: string | null; tagId?: string | null; search?: string; favorite?: boolean }) {
  const queryClient = useQueryClient();

  const notebooksQuery = useQuery<Notebook[]>({
    queryKey: ['notebooks'],
    queryFn: () => apiClient.getNotebooks(),
  });

  const tagsQuery = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(),
  });

  const notesQuery = useQuery<Note[]>({
    queryKey: ['notes', params],
    queryFn: () =>
      apiClient.getNotes({
        notebookId: params?.notebookId || undefined,
        tagId: params?.tagId || undefined,
        search: params?.search || undefined,
        favorite: params?.favorite || undefined,
      }),
  });

  const createNotebookMutation = useMutation({
    mutationFn: (data: { title: string; color?: string }) => apiClient.createNotebook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color?: string }) => apiClient.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string; notebookId: string }) => apiClient.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> & { tagIds?: string[] } }) =>
      apiClient.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notebooks: notebooksQuery.data || [],
    tags: tagsQuery.data || [],
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading || notebooksQuery.isLoading || tagsQuery.isLoading,
    isError: notesQuery.isError,
    createNotebook: createNotebookMutation.mutate,
    deleteNotebook: deleteNotebookMutation.mutate,
    createTag: createTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    createNote: createNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
  };
}