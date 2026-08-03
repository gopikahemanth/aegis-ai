import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tag name is required').max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
    userId: z.string().optional(),
  }),
});