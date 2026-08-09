import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });
    
    res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
    
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ success: true });
  } catch (error) {
    res.json([]);
  }
};