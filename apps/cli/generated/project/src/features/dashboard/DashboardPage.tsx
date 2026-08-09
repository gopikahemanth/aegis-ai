import React from "react";
import Layout from "../../shared/components/Layout";
import MatchDashboard from "../analysis/components/MatchDashboard";
import { useDashboardData } from "./hooks/useDashboardData";

export function DashboardPage(props: any) {
  const { data } = useDashboardData();
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Resume Keyword Scanner Overview</h1>
        <MatchDashboard score={data?.avgMatchScore || 85} />
      </div>
    </Layout>
  );
}

export default DashboardPage;
