export interface User {
  id: string;
  email: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
}