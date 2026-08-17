/**
 * CustomerInterventionEngine
 *
 * Formulates governed intervention recommendations for customers requiring proactive engagement or support.
 * Hard Invariant: Never alters customer state automatically without authorized human signoff.
 */

export type CustomerInterventionRecommendation =
  | "OBSERVE"
  | "INVESTIGATE"
  | "EDUCATE"
  | "ASSIST"
  | "REQUEST_REVIEW"
  | "RECOMMEND_INTERVENTION"
  | "ESCALATE"
  | "NO_ACTION";

export interface CustomerInterventionReport {
  recommendationId: string;
  customerId: string;
  projectId: string;
  recommendedAction: CustomerInterventionRecommendation;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  justification: string;
  requiresAuthorization: boolean;
  generatedAt: string;
}

export class CustomerInterventionEngine {
  public static evaluateIntervention(
    customerId: string,
    projectId: string,
    healthScore: number,
    churnProbability: number
  ): CustomerInterventionReport {
    let rec: CustomerInterventionRecommendation = "NO_ACTION";
    let urgency: CustomerInterventionReport["urgency"] = "LOW";
    let justification = "Customer metrics within healthy thresholds.";

    if (churnProbability >= 70 || healthScore < 35) {
      rec = "ESCALATE";
      urgency = "CRITICAL";
      justification = "Critical churn risk detected. Immediate executive intervention recommended.";
    } else if (churnProbability >= 45 || healthScore < 55) {
      rec = "RECOMMEND_INTERVENTION";
      urgency = "HIGH";
      justification = "Degrading customer health observed. Proactive Customer Success reachout advised.";
    } else if (healthScore < 70) {
      rec = "EDUCATE";
      urgency = "MEDIUM";
      justification = "Under-utilization of core features. Share relevant onboarding and workflow guides.";
    }

    return {
      recommendationId: `rec_int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId,
      projectId,
      recommendedAction: rec,
      urgency,
      justification,
      requiresAuthorization: rec === "ESCALATE" || rec === "RECOMMEND_INTERVENTION",
      generatedAt: new Date().toISOString(),
    };
  }
}
