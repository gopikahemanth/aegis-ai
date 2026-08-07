import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  res.json(transactions);
});

router.post('/', authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const { amount, category, description, type } = req.body;
  
  const transaction = await prisma.transaction.create({
    data: { userId, amount, category, description, type }
  });
  
  res.status(201).json(transaction);
});

export default router;