import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { amount, description, category, type, date } = req.body;
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        type,
        date: new Date(date),
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
    res.status(200).json(transactions);
  } catch (error) {
    res.json([]);
  }
});

app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.json([]);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
