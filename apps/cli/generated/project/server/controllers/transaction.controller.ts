import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const transactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  date: z.string().datetime().optional(),
});

export const createTransaction = async (req: Request, res: Response) => {
  const result = transactionSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const transaction = await prisma.transaction.create({
    data: { 
      ...result.data, 
      userId: (req as any).user.id 
    },
  });
  res.status(201).json(transaction);
};

export const getTransactions = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: (req as any).user.id },
    include: { category: true },
    orderBy: { date: 'desc' }
  });
  res.json(transactions);
};