import * as Mod from '../../src/lib/prisma';
export * from '../../src/lib/prisma';
const _default = (Mod as any).default || Mod;
export const prismaService = _default;
export default _default;

export const db = prisma;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
