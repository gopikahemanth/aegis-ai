import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  date: z.string().datetime().optional(),
});

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const validated = transactionSchema.parse(req.body);
    const userId = (req as any).user.id;

    const transaction = await prisma.transaction.create({
      data: {
        ...validated,
        userId,
        date: validated.date ? new Date(validated.date) : new Date(),
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Invalid transaction data' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: { category: true }
  });
  res.json(transactions);
};