import { useQuery } from "@tanstack/react-query";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/scans/summary");
        if (!res.ok) throw new Error("Offline");
        return await res.json();
      } catch {
        return { total: 14, critical: 3, open: 8, riskScore: 78.5 };
      }
    },
  });
}

export default useDashboardData;
