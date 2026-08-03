import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().max(150).optional(),
    content: z.string().optional(),
    notebookId: z.string().optional(),
    isFavorite: z.boolean().optional(),
    tagIds: z.array(z.string()).optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().max(150).optional(),
    content: z.string().optional(),
    notebookId: z.string().optional(),
    isFavorite: z.boolean().optional(),
    tagIds: z.array(z.string()).optional(),
  }),
});