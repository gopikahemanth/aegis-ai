export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  userId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  isFavorite: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}