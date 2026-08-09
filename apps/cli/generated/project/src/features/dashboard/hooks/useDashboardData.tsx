import { useQuery } from "@tanstack/react-query";
import { resumeApi } from "../../../services/api";

export interface DashboardData {
  scans: any[];
  avgMatchScore: number;
  totalScans: number;
}

export function calculateAvg(scans: any[]): number {
  if (!scans || scans.length === 0) return 0;
  const sum = scans.reduce((acc, s) => acc + (s.matchScore || 0), 0);
  return Math.round(sum / scans.length);
}

export function calculateMissing(scans: any[]): string[] {
  if (!scans || scans.length === 0) return ["TypeScript", "React", "Express"];
  const allMissing = scans.flatMap(s => s.missingKeywords || []);
  return Array.from(new Set(allMissing)).slice(0, 5);
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const scans = await resumeApi.getScanHistory();
        const avgMatchScore = calculateAvg(scans);
        return { scans, avgMatchScore, totalScans: scans.length };
      } catch {
        return { scans: [], avgMatchScore: 0, totalScans: 0 };
      }
    },
  });
}

export default useDashboardData;
