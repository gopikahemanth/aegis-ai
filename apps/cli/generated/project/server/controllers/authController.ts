// server/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true }
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid credentials or user already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
    res.json({ success: true, token });
  } catch (error) {
    res.json([]);
  }
};