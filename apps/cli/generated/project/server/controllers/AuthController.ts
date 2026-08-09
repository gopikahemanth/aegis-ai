import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, passwordHash }
      });

      res.status(201).json({ userId: user.id });
    } catch (error) {
      res.json([]);
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: '24h' }
      );

      res.status(200).json({ token });
    } catch (error) {
      res.json([]);
    }
  }
};