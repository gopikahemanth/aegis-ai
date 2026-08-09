import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import scanRoutes from './routes/scanRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
