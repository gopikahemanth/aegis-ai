/**
 * RequirementSignalEngine
 *
 * Ingests multi-source product signals from user feedback, support tickets,
 * usage trends, and business objectives.
 * Invariant: SIGNAL ≠ REQUIREMENT
 */

export interface RequirementSignal {
  id: string;
  source: "USER_FEEDBACK" | "SUPPORT_TICKET" | "USAGE_ANALYTICS" | "BUSINESS_OBJECTIVE" | "DOMAIN_SIGNAL";
  description: string;
  affectedFeature?: string;
  affectedUsers?: string[];
  evidence: string[];
  frequency: number;
  severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number;
}

export interface SignalCollectionReport {
  productName: string;
  totalSignals: number;
  signals: RequirementSignal[];
  summary: string;
}

export class RequirementSignalEngine {
  public static collectSignals(
    productName: string = "GymMaster Pro",
    opts: {
      simulateExportDemand?: boolean;
      simulateVagueRequest?: boolean;
      simulateDuplicateRequest?: boolean;
      simulateConflictRequest?: boolean;
    } = {}
  ): SignalCollectionReport {
    const {
      simulateExportDemand = true,
      simulateVagueRequest = false,
      simulateDuplicateRequest = false,
      simulateConflictRequest = false,
    } = opts;

    const signals: RequirementSignal[] = [];

    if (simulateVagueRequest) {
      signals.push({
        id: "sig_vague_ai",
        source: "USER_FEEDBACK",
        description: "Maybe we should add AI analytics to the product",
        evidence: ["Single unstructured comment in user feedback box"],
        frequency: 1,
        severity: "LOW",
        confidence: 0.15,
      });
      return {
        productName,
        totalSignals: 1,
        signals,
        summary: "1 unverified feedback signal collected with insufficient evidence.",
      };
    }

    if (simulateDuplicateRequest) {
      signals.push({
        id: "sig_dup_export",
        source: "USER_FEEDBACK",
        description: "I want to download my member list as a spreadsheet",
        evidence: ["User feedback from gym owner requesting member download"],
        frequency: 4,
        severity: "LOW",
        confidence: 0.85,
      });
      return {
        productName,
        totalSignals: 1,
        signals,
        summary: "1 feedback signal collected for duplicate analysis.",
      };
    }

    if (simulateConflictRequest) {
      signals.push(
        {
          id: "sig_conflict_full_export",
          source: "USER_FEEDBACK",
          description: "Managers should be able to export all member personal records and card tokens",
          evidence: ["Manager feature request for unrestricted data extraction"],
          frequency: 5,
          severity: "HIGH",
          confidence: 0.90,
        },
        {
          id: "sig_conflict_security_policy",
          source: "BUSINESS_OBJECTIVE",
          description: "Strict privacy governance: sensitive member data and payment tokens cannot be exported by staff",
          evidence: ["Enterprise security compliance handbook Clause 4.2"],
          frequency: 1,
          severity: "CRITICAL",
          confidence: 1.0,
        }
      );
      return {
        productName,
        totalSignals: 2,
        signals,
        summary: "2 conflicting requirement signals collected requiring policy adjudication.",
      };
    }

    if (simulateExportDemand) {
      signals.push(
        {
          id: "sig_fb_export_1",
          source: "USER_FEEDBACK",
          description: "I keep downloading member information manually one by one; need bulk Excel export",
          affectedFeature: "Member Management",
          affectedUsers: ["Gym Manager", "Frontdesk Staff"],
          evidence: ["18 similar support tickets requesting spreadsheet export in last 30 days"],
          frequency: 18,
          severity: "HIGH",
          confidence: 0.94,
        },
        {
          id: "sig_usage_member_nav",
          source: "USAGE_ANALYTICS",
          description: "Managers repeatedly filter and view member list tables >50 times/day",
          affectedFeature: "Member Table",
          affectedUsers: ["Gym Manager"],
          evidence: ["High navigation frequency on /admin/members without bulk extraction action"],
          frequency: 240,
          severity: "MODERATE",
          confidence: 0.91,
        },
        {
          id: "sig_biz_admin_efficiency",
          source: "BUSINESS_OBJECTIVE",
          description: "Reduce administrative staff time spent on external bookkeeping reconciliations",
          affectedFeature: "Operations",
          affectedUsers: ["Management"],
          evidence: ["Q3 Operational Efficiency Milestone OKR-2"],
          frequency: 1,
          severity: "HIGH",
          confidence: 0.98,
        }
      );
    }

    return {
      productName,
      totalSignals: signals.length,
      signals,
      summary: `Collected ${signals.length} multi-source requirement signals for ${productName}.`,
    };
  }
}
