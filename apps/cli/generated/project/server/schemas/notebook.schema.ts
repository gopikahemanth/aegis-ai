import { z } from 'zod';

export const createNotebookSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
    parentId: z.string().nullable().optional(),
    userId: z.string().optional(),
  }),
});