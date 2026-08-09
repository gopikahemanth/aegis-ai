import { pgTable, serial, text, timestamp, jsonb, real } from 'drizzle-orm/pg-core';

export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  content: text('content').notNull(),
  keywords: jsonb('keywords').$type<{ found: string[]; missing: string[] }>().notNull(),
  matchScore: real('match_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type InsertResume = typeof resumes.$inferInsert;
export type SelectResume = typeof resumes.$inferSelect;