import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import { errorHandler } from './middleware/errorHandler';

export const prisma = new PrismaClient();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ATS Backend running on port ${PORT}`);
});
// Global Express Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Server Error]:', err);
  res.status(200).json({ success: false, data: [], error: err.message || 'Internal Server Error' });
});
