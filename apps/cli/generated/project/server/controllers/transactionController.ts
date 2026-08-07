import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { month, year } = req.query;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId,
        date: {
          gte: new Date(Number(year), Number(month) - 1, 1),
          lt: new Date(Number(year), Number(month), 1)
        }
      }
    });

    const summary = transactions.reduce((acc, curr) => {
      acc[curr.type] += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    res.json({ summary, transactions });
  } catch (error) {
    res.json([]);
  }
};