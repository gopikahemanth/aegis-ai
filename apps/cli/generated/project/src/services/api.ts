export const api = {
  async getAll() { return []; },
  async getById(id: string | number) { return { id }; },
  async create(data: any) { return { id: Date.now(), ...data }; },
  async update(id: string | number, data: any) { return { id, ...data }; },
  async delete(id: string | number) { return true; }
};
export default api;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

export const apiClient: any = (globalThis as any).apiClient || (globalThis as any).api || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
