import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { validate } from './middleware/validate.js';
import { createNotebookSchema } from './schemas/notebook.schema.js';
import { createTagSchema } from './schemas/tag.schema.js';
import { createNoteSchema, updateNoteSchema } from './schemas/note.schema.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

interface InMemTag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface InMemNotebook {
  id: string;
  title: string;
  color: string;
  userId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InMemNote {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  isFavorite: boolean;
  tags: InMemTag[];
  createdAt: string;
  updatedAt: string;
}

let inMemTags: InMemTag[] = [
  { id: 'tag-1', name: 'Engineering', color: '#3b82f6', userId: 'default-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tag-2', name: 'Architecture', color: '#8b5cf6', userId: 'default-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tag-3', name: 'Ideas', color: '#10b981', userId: 'default-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let inMemNotebooks: InMemNotebook[] = [
  { id: 'nb-1', title: 'System Specs', color: '#3b82f6', userId: 'default-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'nb-2', title: 'Personal Notes', color: '#10b981', userId: 'default-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let inMemNotes: InMemNote[] = [
  {
    id: 'note-1',
    title: 'Welcome to Aegis Knowledge Base',
    content: `# Welcome to Aegis Knowledge\n\nThis is your personal, production-ready fullstack markdown note-taking workspace.\n\n## Core Features:\n- **Relational Notebooks & Tags**: Organize your knowledge systematically.\n- **Instant Fuzzy Search**: Search titles and text using \`Cmd+K\` or \`Ctrl+K\`.\n- **Split-Pane Markdown Workspace**: Live preview and editor controls.\n- **Multi-Format Document Export**: Save to Markdown (.md), Plain Text (.txt), JSON, or PDF.\n\n\`\`\`ts\nfunction calculateScore(query: string, content: string): number {\n  return content.includes(query) ? 1.0 : 0.0;\n}\n\`\`\`\n\n> "Knowledge is power. Organization is clarity."`,
    notebookId: 'nb-1',
    isFavorite: true,
    tags: [inMemTags[0], inMemTags[1]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'System Architecture & Data Flows',
    content: `## Layered Architecture\n\nOur system uses Express REST endpoints with Zod schema validation middleware, Prisma ORM, and React Query on the frontend.\n\n- [x] Prisma Client & Express API\n- [x] Live Split Pane Markdown Editor\n- [x] Tag Indexing & Instant Search\n- [x] Document Exporter`,
    notebookId: 'nb-1',
    isFavorite: false,
    tags: [inMemTags[0]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let isPrismaConnected = false;

async function checkPrismaConnection() {
  try {
    await prisma.$connect();
    isPrismaConnected = true;

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const user = await prisma.user.create({
        data: { id: 'default-user', email: 'user@aegis.dev' },
      });
      const nb1 = await prisma.notebook.create({
        data: { id: 'nb-1', title: 'System Specs', color: '#3b82f6', userId: user.id },
      });
      const tag1 = await prisma.tag.create({
        data: { id: 'tag-1', name: 'Engineering', color: '#3b82f6', userId: user.id },
      });
      await prisma.note.create({
        data: {
          id: 'note-1',
          title: 'Welcome to Aegis Knowledge Base',
          content: `# Welcome to Aegis Knowledge\n\nThis is your personal, production-ready fullstack markdown note-taking workspace.`,
          notebookId: nb1.id,
          isFavorite: true,
          tags: { connect: [{ id: tag1.id }] },
        },
      });
    }
  } catch {
    isPrismaConnected = false;
  }
}

checkPrismaConnection();

// NOTEBOOKS API
app.get('/api/notebooks', async (_req: Request, res: Response) => {
  try {
    if (isPrismaConnected) {
      const notebooks = await prisma.notebook.findMany({
        include: { _count: { select: { notes: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(notebooks);
    }
    return res.json(inMemNotebooks);
  } catch {
    return res.json(inMemNotebooks);
  }
});

app.post('/api/notebooks', validate(createNotebookSchema), async (req: Request, res: Response) => {
  try {
    const { title, color, parentId, userId } = req.body;

    if (isPrismaConnected) {
      const notebook = await prisma.notebook.create({
        data: {
          title,
          color: color || '#3b82f6',
          parentId: parentId || null,
          userId: userId || 'default-user',
        },
      });
      return res.status(201).json(notebook);
    }

    const newNb: InMemNotebook = {
      id: `nb-${Date.now()}`,
      title,
      color: color || '#3b82f6',
      userId: userId || 'default-user',
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemNotebooks.unshift(newNb);
    return res.status(201).json(newNb);
  } catch {
    return res.status(500).json({ error: 'Failed to create notebook' });
  }
});

app.delete('/api/notebooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isPrismaConnected) {
      await prisma.notebook.delete({ where: { id } });
      return res.status(204).send();
    }
    inMemNotebooks = inMemNotebooks.filter((nb) => nb.id !== id);
    inMemNotes = inMemNotes.filter((n) => n.notebookId !== id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete notebook' });
  }
});

// TAGS API
app.get('/api/tags', async (_req: Request, res: Response) => {
  try {
    if (isPrismaConnected) {
      const tags = await prisma.tag.findMany({
        include: { _count: { select: { notes: true } } },
        orderBy: { name: 'asc' },
      });
      return res.json(tags);
    }
    return res.json(inMemTags);
  } catch {
    return res.json(inMemTags);
  }
});

app.post('/api/tags', validate(createTagSchema), async (req: Request, res: Response) => {
  try {
    const { name, color, userId } = req.body;

    if (isPrismaConnected) {
      const tag = await prisma.tag.create({
        data: {
          name,
          color: color || '#64748b',
          userId: userId || 'default-user',
        },
      });
      return res.status(201).json(tag);
    }

    const newTag: InMemTag = {
      id: `tag-${Date.now()}`,
      name,
      color: color || '#64748b',
      userId: userId || 'default-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemTags.push(newTag);
    return res.status(201).json(newTag);
  } catch {
    return res.status(500).json({ error: 'Failed to create tag' });
  }
});

app.delete('/api/tags/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isPrismaConnected) {
      await prisma.tag.delete({ where: { id } });
      return res.status(204).send();
    }
    inMemTags = inMemTags.filter((t) => t.id !== id);
    inMemNotes = inMemNotes.map((n) => ({
      ...n,
      tags: n.tags.filter((t) => t.id !== id),
    }));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// NOTES API
app.get('/api/notes', async (req: Request, res: Response) => {
  try {
    const { notebookId, tagId, search, favorite } = req.query;

    if (isPrismaConnected) {
      const where: Record<string, unknown> = {};
      if (notebookId) where.notebookId = String(notebookId);
      if (favorite === 'true') where.isFavorite = true;
      if (tagId) where.tags = { some: { id: String(tagId) } };
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { content: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const notes = await prisma.note.findMany({
        where,
        include: { tags: true, notebook: true },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(notes);
    }

    let results = [...inMemNotes];
    if (notebookId) results = results.filter((n) => n.notebookId === String(notebookId));
    if (favorite === 'true') results = results.filter((n) => n.isFavorite);
    if (tagId) results = results.filter((n) => n.tags.some((t) => t.id === String(tagId)));
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return res.json(results);
  } catch {
    return res.json(inMemNotes);
  }
});

app.get('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isPrismaConnected) {
      const note = await prisma.note.findUnique({
        where: { id },
        include: { tags: true, notebook: true },
      });
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.json(note);
    }

    const note = inMemNotes.find((n) => n.id === id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    return res.json(note);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.post('/api/notes', validate(createNoteSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, notebookId, tagIds, isFavorite } = req.body;
    let targetNotebookId = notebookId;

    if (!targetNotebookId) {
      if (isPrismaConnected) {
        const firstNb = await prisma.notebook.findFirst();
        targetNotebookId = firstNb?.id;
      } else {
        targetNotebookId = inMemNotebooks[0]?.id || 'nb-1';
      }
    }

    if (!targetNotebookId) {
      return res.status(400).json({ error: 'Notebook ID is required' });
    }

    if (isPrismaConnected) {
      const note = await prisma.note.create({
        data: {
          title: title || 'Untitled Note',
          content: content || '',
          notebookId: targetNotebookId,
          isFavorite: Boolean(isFavorite),
          tags: tagIds && Array.isArray(tagIds)
            ? { connect: tagIds.map((id: string) => ({ id })) }
            : undefined,
        },
        include: { tags: true, notebook: true },
      });
      return res.status(201).json(note);
    }

    const matchedTags = inMemTags.filter((t) => tagIds?.includes(t.id));
    const newNote: InMemNote = {
      id: `note-${Date.now()}`,
      title: title || 'Untitled Note',
      content: content || '',
      notebookId: targetNotebookId,
      isFavorite: Boolean(isFavorite),
      tags: matchedTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemNotes.unshift(newNote);
    return res.status(201).json(newNote);
  } catch {
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', validate(updateNoteSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, notebookId, isFavorite, tagIds } = req.body;

    if (isPrismaConnected) {
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (notebookId !== undefined) data.notebookId = notebookId;
      if (isFavorite !== undefined) data.isFavorite = isFavorite;
      if (tagIds && Array.isArray(tagIds)) {
        data.tags = {
          set: tagIds.map((tId: string) => ({ id: tId })),
        };
      }

      const updated = await prisma.note.update({
        where: { id },
        data,
        include: { tags: true, notebook: true },
      });
      return res.json(updated);
    }

    const noteIndex = inMemNotes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return res.status(404).json({ error: 'Note not found' });

    const existing = inMemNotes[noteIndex];
    const updatedNote: InMemNote = {
      ...existing,
      title: title !== undefined ? title : existing.title,
      content: content !== undefined ? content : existing.content,
      notebookId: notebookId !== undefined ? notebookId : existing.notebookId,
      isFavorite: isFavorite !== undefined ? isFavorite : existing.isFavorite,
      tags: tagIds && Array.isArray(tagIds)
        ? inMemTags.filter((t) => tagIds.includes(t.id))
        : existing.tags,
      updatedAt: new Date().toISOString(),
    };

    inMemNotes[noteIndex] = updatedNote;
    return res.json(updatedNote);
  } catch {
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isPrismaConnected) {
      await prisma.note.delete({ where: { id } });
      return res.status(204).send();
    }
    inMemNotes = inMemNotes.filter((n) => n.id !== id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.listen(PORT, () => {
  // Express server operational
});