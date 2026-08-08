export const pdfExtractor = {
  async getAll() { return []; },
  async getById(id: string | number) { return { id }; },
  async create(data: any) { return { id: Date.now(), ...data }; },
  async update(id: string | number, data: any) { return { id, ...data }; },
  async delete(id: string | number) { return true; }
};
export default pdfExtractor;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
