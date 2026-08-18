import apiClient from "./api";

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/api/scans/upload", formData);
  return res.data;
}

export async function analyzeResume(resumeText: string, jobDescriptionText: string) {
  const res = await apiClient.post("/api/scans/analyze", { resumeText, jobDescriptionText });
  return res.data;
}

export default { uploadResume, analyzeResume };
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});