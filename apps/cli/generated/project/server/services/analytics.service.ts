import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMonthlySpending = async (userId: string, month: number, year: number) => {
  return await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, date: { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) } },
    _sum: { amount: true }
  });
};