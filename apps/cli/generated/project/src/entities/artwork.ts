export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Artwork {
  id: number;
  title: string;
  artist: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  category: Category; // Added relation
  createdAt: string;
  updatedAt: string;
}