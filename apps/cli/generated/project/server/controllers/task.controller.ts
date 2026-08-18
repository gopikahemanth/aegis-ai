import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { }
    });
    res.json(tasks);
  } catch (error) {
    res.json([]);
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.create({
      data: { ...req.body, }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: 'Invalid task data' });
  }
};