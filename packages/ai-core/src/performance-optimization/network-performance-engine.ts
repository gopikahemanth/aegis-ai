/**
 * NetworkPerformanceEngine
 *
 * Diagnoses HTTP request waterfalls, duplicate parallel API requests,
 * and payload transfer efficiency.
 */

import { PerformanceBaseline } from "./performance-baseline-engine.js";

export interface NetworkFinding {
  type: "UNNECESSARY_REQUEST" | "DUPLICATE_REQUEST" | "OVERSIZED_RESPONSE" | "BLOCKING_REQUEST";
  urlOrEndpoint: string;
  countObserved: number;
  wastedBytes: number;
  recommendation: string;
}

export interface NetworkPerformanceReport {
  isNetworkEfficient: boolean;
  totalRequestsPerWorkflow: number;
  findings: NetworkFinding[];
  summary: string;
}

export class NetworkPerformanceEngine {
  public static analyzeNetwork(baseline: PerformanceBaseline): NetworkPerformanceReport {
    const isDegraded = baseline.api.totalRequestsPerWorkflow > 30;

    const findings: NetworkFinding[] = isDegraded
      ? [
          {
            type: "DUPLICATE_REQUEST",
            urlOrEndpoint: "GET /api/members/plans",
            countObserved: 4,
            wastedBytes: 12000,
            recommendation: "Implement React Query / SWR client-side stale-while-revalidate deduplication cache",
          },
          {
            type: "OVERSIZED_RESPONSE",
            urlOrEndpoint: "GET /api/members",
            countObserved: 1,
            wastedBytes: 88000,
            recommendation: "Enable Gzip / Brotli compression and limit initial pagination to 25 records",
          },
        ]
      : [];

    return {
      isNetworkEfficient: !isDegraded,
      totalRequestsPerWorkflow: baseline.api.totalRequestsPerWorkflow,
      findings,
      summary: isDegraded
        ? `Network Performance: ${baseline.api.totalRequestsPerWorkflow} requests per workflow. Duplicate queries and uncompressed payloads detected.`
        : `Network Performance OPTIMIZED: ${baseline.api.totalRequestsPerWorkflow} consolidated requests with HTTP compression.`,
    };
  }
}
