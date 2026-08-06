import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  description: z.string().max(200),
});

export const createTransaction = async (req: Request, res: Response) => {
  const validation = transactionSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json(validation.error);

  const transaction = await prisma.transaction.create({
    data: {
      ...validation.data,
      userId: (req as any).user.id,
    },
  });
  res.status(201).json(transaction);
};

export const getTransactions = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: (req as any).user.id },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
};