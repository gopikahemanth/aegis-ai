import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all decks
app.get('/api/decks', async (req, res) => {
  try {
    const rawDecks = await prisma.deck.findMany({
      include: { cards: true },
      orderBy: { createdAt: 'desc' }
    });
    const decks = rawDecks.map(deck => ({
      ...deck,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
      cards: deck.cards.map(card => ({
        ...card,
        hints: card.hints || undefined,
        tags: card.tags ? card.tags.split(',').filter(Boolean) : [],
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString()
      }))
    }));
    res.json(decks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// GET single deck by ID
app.get('/api/decks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawDeck = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true }
    });
    if (!rawDeck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    const deck = {
      ...rawDeck,
      createdAt: rawDeck.createdAt.toISOString(),
      updatedAt: rawDeck.updatedAt.toISOString(),
      cards: rawDeck.cards.map(card => ({
        ...card,
        hints: card.hints || undefined,
        tags: card.tags ? card.tags.split(',').filter(Boolean) : [],
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString()
      }))
    };
    res.json(deck);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// CREATE deck
app.post('/api/decks', async (req, res) => {
  try {
    const { title, description, category, isPublic, userId } = req.body;
    const targetUserId = userId || 'default-user-id';

    await prisma.user.upsert({
      where: { id: targetUserId },
      update: {},
      create: {
        id: targetUserId,
        email: 'user@flashcardhub.io',
        passwordHash: 'hashed_placeholder'
      }
    });

    const rawDeck = await prisma.deck.create({
      data: {
        title,
        description: description || '',
        category: category || 'General',
        isPublic: isPublic ?? true,
        userId: targetUserId
      },
      include: { cards: true }
    });
    const deck = {
      ...rawDeck,
      createdAt: rawDeck.createdAt.toISOString(),
      updatedAt: rawDeck.updatedAt.toISOString(),
      cards: rawDeck.cards.map(card => ({
        ...card,
        hints: card.hints || undefined,
        tags: card.tags ? card.tags.split(',').filter(Boolean) : [],
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString()
      }))
    };
    res.status(201).json(deck);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// UPDATE deck
app.put('/api/decks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isPublic } = req.body;
    const rawUpdated = await prisma.deck.update({
      where: { id },
      data: { title, description, category, isPublic },
      include: { cards: true }
    });
    const updated = {
      ...rawUpdated,
      createdAt: rawUpdated.createdAt.toISOString(),
      updatedAt: rawUpdated.updatedAt.toISOString(),
      cards: rawUpdated.cards.map(card => ({
        ...card,
        hints: card.hints || undefined,
        tags: card.tags ? card.tags.split(',').filter(Boolean) : [],
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString()
      }))
    };
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// DELETE deck
app.delete('/api/decks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.deck.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// UPSERT (Create or Update) Card
app.post('/api/decks/:deckId/cards', async (req, res) => {
  try {
    const { deckId } = req.params;
    const { id, front, back, hints, tags } = req.body;

    let rawCard;
    const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || '');

    if (id) {
      rawCard = await prisma.card.update({
        where: { id },
        data: { front, back, hints, tags: tagsString }
      });
    } else {
      rawCard = await prisma.card.create({
        data: {
          deckId,
          front,
          back,
          hints,
          tags: tagsString
        }
      });
    }
    const card = {
      ...rawCard,
      hints: rawCard.hints || undefined,
      tags: rawCard.tags ? rawCard.tags.split(',').filter(Boolean) : [],
      createdAt: rawCard.createdAt.toISOString(),
      updatedAt: rawCard.updatedAt.toISOString()
    };
    res.json(card);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// DELETE Card
app.delete('/api/cards/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    await prisma.card.delete({ where: { id: cardId } });
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// SAVE Quiz Session Result
app.post('/api/quiz-sessions', async (req, res) => {
  try {
    const { deckId, userId, score, totalCards, correctCount, incorrectCount, durationSeconds } = req.body;
    const targetUserId = userId || 'default-user-id';

    const rawSession = await prisma.quizSession.create({
      data: {
        deckId,
        userId: targetUserId,
        score,
        totalCards,
        correctCount,
        incorrectCount,
        durationSeconds
      }
    });
    const session = {
      ...rawSession,
      completedAt: rawSession.completedAt.toISOString(),
      createdAt: rawSession.createdAt.toISOString()
    };
    res.status(201).json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

// GET Dashboard Metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const totalDecks = await prisma.deck.count();
    const totalCards = await prisma.card.count();
    const sessions = await prisma.quizSession.findMany();
    const quizzesCompleted = sessions.length;
    const averageScore = quizzesCompleted > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / quizzesCompleted)
      : 0;

    res.json({
      totalDecks,
      totalCards,
      quizzesCompleted,
      averageScore
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Flashcard Hub Express Server running on port ${PORT}`);
});