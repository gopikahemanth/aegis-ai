/**
 * ProductSignalIntelligenceEngine
 *
 * Discovers and interprets customer, usage, and product performance signals.
 * Hard Invariant: SIGNAL != INSIGHT.
 */

export type ProductSignalType =
  | "CUSTOMER_REQUEST"
  | "FEATURE_USAGE_CHANGE"
  | "CUSTOMER_FRICTION"
  | "FEATURE_ADOPTION"
  | "PRODUCT_PERFORMANCE"
  | "CUSTOMER_RETENTION"
  | "CUSTOMER_VALUE"
  | "PRODUCT_GAP"
  | "EMERGING_NEED";

export interface ProductSignal {
  signalId: string;
  projectId: string;
  type: ProductSignalType;
  title: string;
  evidenceSummary: string;
  strengthScore: number;
  observedAt: string;
}

export interface InterpretedProductInsight {
  insightId: string;
  signalId: string;
  projectId: string;
  insightCategory: string;
  hypothesis: string;
  confidenceScore: number;
  generatedAt: string;
}

export class ProductSignalIntelligenceEngine {
  public static discoverSignals(
    projectId: string,
    customerRequestsCount: number,
    frictionDropoffRate: number,
    featureAdoptionSlope: number
  ): ProductSignal[] {
    const signals: ProductSignal[] = [];
    const now = new Date().toISOString();

    if (customerRequestsCount >= 5) {
      signals.push({
        signalId: `sig_${Date.now()}_req`,
        projectId,
        type: "CUSTOMER_REQUEST",
        title: "Customer Demand for Live Attendance Check-in",
        evidenceSummary: `${customerRequestsCount} explicit customer requests recorded in product feedback telemetry.`,
        strengthScore: 0.95,
        observedAt: now,
      });
    }

    if (frictionDropoffRate > 0.15) {
      signals.push({
        signalId: `sig_${Date.now()}_friction`,
        projectId,
        type: "CUSTOMER_FRICTION",
        title: "Checkout Flow Drop-off Degradation",
        evidenceSummary: `Drop-off rate during membership checkout rose to ${(frictionDropoffRate * 100).toFixed(1)}%.`,
        strengthScore: 0.88,
        observedAt: now,
      });
    }

    if (featureAdoptionSlope > 0.2) {
      signals.push({
        signalId: `sig_${Date.now()}_adoption`,
        projectId,
        type: "FEATURE_ADOPTION",
        title: "Rapid Acceleration in Mobile Attendance Usage",
        evidenceSummary: `Mobile attendance check-in adoption increased by ${(featureAdoptionSlope * 100).toFixed(1)}% this month.`,
        strengthScore: 0.92,
        observedAt: now,
      });
    }

    return signals;
  }

  public static interpretInsight(signal: ProductSignal): InterpretedProductInsight {
    return {
      insightId: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      signalId: signal.signalId,
      projectId: signal.projectId,
      insightCategory: signal.type,
      hypothesis: `Addressing signal '${signal.title}' will improve product user retention and workflow completion rates.`,
      confidenceScore: signal.strengthScore,
      generatedAt: new Date().toISOString(),
    };
  }
}
