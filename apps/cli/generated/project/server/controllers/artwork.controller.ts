import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const ArtworkSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
});

export const createArtwork = async (req: Request, res: Response) => {
  try {
    const validated = ArtworkSchema.parse(req.body);
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Image is required' });

    const artwork = await prisma.artwork.create({
      data: {
        ...validated,
        imageUrl: `/uploads/${file.filename}`,
      },
    });
    res.status(201).json(artwork);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
};