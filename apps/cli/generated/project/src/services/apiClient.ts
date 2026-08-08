import * as Mod from './api';
export * from './api';
const _default = (Mod as any).default || Mod;
export const apiClient = _default;
export default _default;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

export const api: any = (globalThis as any).api || (globalThis as any).apiClient || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
