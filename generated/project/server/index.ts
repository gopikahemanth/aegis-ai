import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to ensure a default user exists
async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: 'default-hash'
      }
    });
  }
  return user;
}

// 1. GET /api/decks - Fetch all decks
app.get('/api/decks', async (req, res) => {
  try {
    const decks = await prisma.deck.findMany({
      include: { cards: true },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = decks.map(d => ({
      ...d,
      cardCount: d.cards.length,
      cardsCount: d.cards.length
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/decks/:id - Fetch single deck with cards
app.get('/api/decks/:id', async (req, res) => {
  try {
    const deck = await prisma.deck.findUnique({
      where: { id: req.params.id },
      include: { cards: true }
    });
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json({
      ...deck,
      cardCount: deck.cards.length,
      cardsCount: deck.cards.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/decks - Create deck
app.post('/api/decks', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
    const { title, description, category, isPublic } = req.body;
    const deck = await prisma.deck.create({
      data: {
        title,
        description: description || '',
        category: category || 'General',
        isPublic: isPublic ?? true,
        userId: user.id
      },
      include: { cards: true }
    });
    res.json({
      ...deck,
      cardCount: 0,
      cardsCount: 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/decks/:id - Update deck
app.put('/api/decks/:id', async (req, res) => {
  try {
    const { title, description, category, isPublic } = req.body;
    const updated = await prisma.deck.update({
      where: { id: req.params.id },
      data: { title, description, category, isPublic },
      include: { cards: true }
    });
    res.json({
      ...updated,
      cardCount: updated.cards.length,
      cardsCount: updated.cards.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/decks/:id - Delete deck
app.delete('/api/decks/:id', async (req, res) => {
  try {
    await prisma.deck.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/decks/:deckId/cards - Save or update card
app.post('/api/decks/:deckId/cards', async (req, res) => {
  try {
    const { id, front, back, hints, tags } = req.body;
    const tagString = Array.isArray(tags) ? tags.join(',') : (tags || '');

    let card;
    if (id) {
      card = await prisma.card.update({
        where: { id },
        data: { front, back, hints, tags: tagString }
      });
    } else {
      card = await prisma.card.create({
        data: {
          deckId: req.params.deckId,
          front,
          back,
          hints,
          tags: tagString
        }
      });
    }
    const tagsArray = card.tags ? card.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    res.json({ ...card, tags: tagsArray });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DELETE /api/cards/:cardId - Delete card
app.delete('/api/cards/:cardId', async (req, res) => {
  try {
    await prisma.card.delete({ where: { id: req.params.cardId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/quiz-sessions - Save quiz session
app.post('/api/quiz-sessions', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
    const { deckId, score, totalCards, correctCount, incorrectCount, durationSeconds } = req.body;
    const session = await prisma.quizSession.create({
      data: {
        deckId,
        userId: user.id,
        score,
        totalCards,
        correctCount,
        incorrectCount,
        durationSeconds
      }
    });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/metrics - Real DB aggregated metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const totalDecks = await prisma.deck.count();
    const totalCards = await prisma.card.count();
    const quizzesCompleted = await prisma.quizSession.count();
    const avg = await prisma.quizSession.aggregate({
      _avg: { score: true }
    });

    res.json({
      totalDecks,
      totalCards,
      quizzesCompleted,
      averageScore: Math.round(avg._avg.score || 0)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Express Server] Running on http://localhost:${PORT}`);
});
