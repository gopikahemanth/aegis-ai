import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllArtworks = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const where = category && category !== 'all' ? { category: { slug: String(category) } } : {};
    
    const artworks = await prisma.artwork.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: artworks });
  } catch (error) {
    res.json([]);
  }
};

export const createArtwork = async (req: Request, res: Response) => {
  try {
    const { title, artist, description, imageUrl, categoryId } = req.body;
    const newArtwork = await prisma.artwork.create({
      data: { title, artist, description, imageUrl, categoryId: Number(categoryId) }
    });
    res.status(201).json({ success: true, data: newArtwork });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation failed' });
  }
};