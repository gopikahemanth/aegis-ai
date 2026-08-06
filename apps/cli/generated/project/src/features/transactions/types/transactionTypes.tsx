export interface Artwork { id: string | number; title: string; imageUrl: string; price: number; artist: { name: string; [key: string]: any } | any; category?: any; medium?: string; createdAt?: string; updatedAt?: string; [key: string]: any; }
export interface User { id: string | number; email: string; name?: string; }
export interface Artist { id: string | number; name: string; }
export interface Category { id: string | number; name: string; }
export interface transactionTypes { id: string | number; title?: string; name?: string; email?: string; imageUrl?: string; price?: number; artist?: any; category?: any; medium?: string; createdAt?: string; updatedAt?: string; [key: string]: any; }
export type transactionTypesInput = Partial<transactionTypes>;
export default transactionTypes;

export type TransactionTypes = any;
export default TransactionTypes;
