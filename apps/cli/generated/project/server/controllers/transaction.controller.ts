import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';

export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });
  res.json(transactions);
};

export const createTransaction = async (req: Request, res: Response) => {
  const { amount, description, type, categoryId } = req.body;
  const userId = (req as any).user.id;
  
  const transaction = await prisma.transaction.create({
    data: { amount, description, type, categoryId, userId }
  });
  res.status(201).json(transaction);
};