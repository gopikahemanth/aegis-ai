import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getArtworks = async (req: Request, res: Response) => {
  try {
    const { search, category, sortBy } = req.query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { artist: { name: { contains: search as string } } }
      ];
    }
    if (category) {
      where.category = { slug: category as string };
    }

    const orderBy: any = sortBy === 'price_asc' 
      ? { price: 'asc' } 
      : { createdAt: 'desc' };

    const data = await prisma.artwork.findMany({
      where,
      orderBy,
      include: { artist: true, category: true }
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery data' });
  }
};