import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import { artworkRoutes } from './routes/artwork.routes';
import { authRoutes } from './routes/auth.routes';

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3001, () => console.log('Server running on port 3001'));