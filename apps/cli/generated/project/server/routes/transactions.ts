import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId: (req as any).user.id,
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: new Date(date)
      }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create transaction' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: (req as any).user.id },
    orderBy: { date: 'desc' }
  });
  res.json(transactions);
});

export default router;