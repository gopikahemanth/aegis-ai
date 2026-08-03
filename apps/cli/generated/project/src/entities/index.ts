export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  userId: string;
  parentId?: string | null;
  children?: Notebook[];
  _count?: { notes: number };
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  _count?: { notes: number };
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  notebook?: Notebook;
  isFavorite: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}