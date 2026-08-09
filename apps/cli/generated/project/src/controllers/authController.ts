import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });
    res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed: User might already exist.' });
  }
};