// server/controllers/auth.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });

    res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
};