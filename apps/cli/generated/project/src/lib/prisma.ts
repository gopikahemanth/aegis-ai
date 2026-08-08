import { PrismaClient } from '@prisma/client';
export const prisma = (globalThis as any).prisma || new PrismaClient();
export default prisma;
export const db = prisma;
