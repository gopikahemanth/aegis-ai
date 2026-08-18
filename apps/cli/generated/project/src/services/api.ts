import axios from "axios";
import { getToken } from "../lib/auth";
import type { AnalysisResult, ScanHistoryItem } from "../types/index";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

apiClient.interceptors.request.use(config => {
  const token = getToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function analyzeScan(data: any): Promise<AnalysisResult> {
  const res = await apiClient.post<AnalysisResult>("/api/scans/analyze", data);
  return res.data;
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const res = await apiClient.get<ScanHistoryItem[]>("/api/scans/history");
  return res.data;
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await apiClient.post<{ token: string }>("/api/auth/login", { email, password });
  return res.data;
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  const res = await apiClient.post<{ token: string }>("/api/auth/register", { email, password });
  return res.data;
}

export async function uploadResume(formData: FormData): Promise<{ text: string }> {
  const res = await apiClient.post<{ text: string }>("/api/scans/upload", formData);
  return res.data;
}

export const api = Object.assign(apiClient, {
  analyzeScan,
  getScanHistory,
  login,
  register,
  uploadResume,
});

export const resumeApi = api;
export const scanApi = api;

export default api;
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});