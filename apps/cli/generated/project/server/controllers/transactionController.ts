import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  const { amount, type, date, categoryId, description } = req.body;
  const userId = (req as any).user.id;

  try {
    const transaction = await prisma.transaction.create({
      data: { amount, type, date: new Date(date), categoryId, userId, description }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.json([]);
  }
};