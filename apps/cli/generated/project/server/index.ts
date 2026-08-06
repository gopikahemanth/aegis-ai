import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Example Controller Logic
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  // Use bcrypt to hash password before saving
  // Implementation will follow standard auth patterns
  res.status(201).json({ success: true });
});

app.listen(3000, () => console.log('Aegis Backend Running on port 3000'));
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
