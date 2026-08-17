/**
 * ProductObservationEngine
 *
 * Collects runtime telemetry, user journey interactions, API latency distributions,
 * error rates, and workflow abandonment signals from live production systems.
 * Invariant: OBSERVATION ≠ PERMISSION TO MODIFY
 */

export interface ProductObservation {
  id: string;
  type: "WORKFLOW_FUNNEL" | "API_METRIC" | "ERROR_SIGNAL" | "UX_INTERACTION" | "MAINTENANCE_EVENT";
  timestamp: string;
  source: string;
  feature: string;
  severity: "INFO" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  value?: number;
  evidence: string[];
}

export interface ObservationStream {
  productName: string;
  collectedAt: string;
  totalObservations: number;
  observations: ProductObservation[];
  summary: string;
}

export class ProductObservationEngine {
  public static collectObservations(
    productName: string = "GymMaster Pro",
    opts: {
      simulateCheckoutBottleneck?: boolean;
      simulateMaintenanceAnomaly?: boolean;
    } = {}
  ): ObservationStream {
    const { simulateCheckoutBottleneck = true, simulateMaintenanceAnomaly = false } = opts;

    const observations: ProductObservation[] = [
      {
        id: "obs_dash_usage",
        type: "UX_INTERACTION",
        timestamp: new Date().toISOString(),
        source: "frontend_telemetry",
        feature: "Admin Dashboard",
        severity: "INFO",
        value: 1450,
        evidence: ["1,450 pageviews recorded across 24 hours"],
      },
      {
        id: "obs_member_search",
        type: "UX_INTERACTION",
        timestamp: new Date().toISOString(),
        source: "frontend_telemetry",
        feature: "Member Search",
        severity: "INFO",
        value: 920,
        evidence: ["920 member queries executed with 0.0% error rate"],
      },
    ];

    if (simulateMaintenanceAnomaly) {
      observations.push({
        id: "obs_maint_drop",
        type: "MAINTENANCE_EVENT",
        timestamp: new Date().toISOString(),
        source: "infrastructure_scheduler",
        feature: "Database Cluster",
        severity: "LOW",
        value: 0,
        evidence: [
          "Scheduled database index re-indexing maintenance window (02:00-02:15 UTC)",
          "Temporary 15-minute traffic dip coinciding with scheduled maintenance",
        ],
      });
    }

    if (simulateCheckoutBottleneck) {
      observations.push(
        {
          id: "obs_chk_starts",
          type: "WORKFLOW_FUNNEL",
          timestamp: new Date().toISOString(),
          source: "client_analytics",
          feature: "Membership Checkout",
          severity: "INFO",
          value: 1000,
          evidence: ["1,000 checkout workflows initiated"],
        },
        {
          id: "obs_chk_abandons",
          type: "WORKFLOW_FUNNEL",
          timestamp: new Date().toISOString(),
          source: "client_analytics",
          feature: "Membership Checkout",
          severity: "HIGH",
          value: 380,
          evidence: [
            "380 checkout sessions abandoned before payment submission (38% abandonment rate)",
            "72% of abandoned sessions originated on mobile viewports",
          ],
        },
        {
          id: "obs_chk_api_p95",
          type: "API_METRIC",
          timestamp: new Date().toISOString(),
          source: "ingress_controller",
          feature: "POST /api/payments/create-intent",
          severity: "HIGH",
          value: 2100,
          evidence: [
            "Checkout API P95 latency is 2,100ms on mobile LTE networks",
            "Payment intent creation takes 3 round trips to external processor",
          ],
        }
      );
    }

    return {
      productName,
      collectedAt: new Date().toISOString(),
      totalObservations: observations.length,
      observations,
      summary: `Product Observation Stream: ${observations.length} active telemetry observations collected.`,
    };
  }
}
