import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

router.get('/', async (req, res) => {
  const { search, category, sortBy } = req.query;
  const where: any = {};

  if (typeof search === 'string') {
    where.OR = [{ title: { contains: search } }, { artistName: { contains: search } }];
  }
  if (typeof category === 'string' && category !== 'ALL') {
    where.category = category;
  }

  const orderBy: any = sortBy === 'price_asc' ? { price: 'asc' } : { createdAt: 'desc' };

  try {
    const artworks = await prisma.artwork.findMany({ where, orderBy });
    res.json(artworks);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

export default router;