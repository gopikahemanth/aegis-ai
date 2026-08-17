import apiClient from "../../../services/api";

export async function getHistory() {
  const res = await apiClient.get("/api/scans/history");
  return res.data;
}

export default { getHistory };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
