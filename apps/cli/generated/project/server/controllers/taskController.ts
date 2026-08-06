import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const taskController = {
  async getAll(userId: number) {
    return await prisma.task.findMany({ where: { userId } });
  },
  
  async create(data: { title: string, description?: string, userId: number }) {
    return await prisma.task.create({ data });
  },

  async update(id: number, data: { status: string }) {
    return await prisma.task.update({ where: { id }, data });
  }
};