import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadArtwork = async (req: Request, res: Response) => {
  try {
    const { title, artistName, description, price, category } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const artwork = await prisma.artwork.create({
      data: {
        title,
        artistName,
        description,
        price: parseFloat(price),
        category,
        imageUrl
      }
    });
    res.status(201).json(artwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload artwork' });
  }
};

export const getArtworks = async (req: Request, res: Response) => {
  const { category, search } = req.query;
  const where: any = {};
  
  if (category && category !== 'ALL') where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { artistName: { contains: search as string } }
    ];
  }

  const artworks = await prisma.artwork.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(artworks);
};