import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, description, category, type } = req.body;
    const userId = (req as any).user.id;
    
    const transaction = await prisma.transaction.create({
      data: { amount, description, category, type, userId }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  res.json(transactions);
};