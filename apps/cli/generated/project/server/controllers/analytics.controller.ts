import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSummary = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const [totalSpent, categoryData] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
    })
  ]);

  res.json({
    totalSpent: totalSpent._sum.amount || 0,
    categoryBreakdown: categoryData
  });
};