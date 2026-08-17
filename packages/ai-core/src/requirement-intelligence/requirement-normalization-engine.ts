/**
 * RequirementNormalizationEngine
 *
 * Consolidates semantically equivalent candidate requirements into standardized, canonical forms.
 */

import { CandidateRequirement } from "./requirement-discovery-engine.js";

export interface NormalizedRequirement extends CandidateRequirement {
  canonicalDomain: string;
  normalizedKeywords: string[];
}

export class RequirementNormalizationEngine {
  public static normalize(candidates: CandidateRequirement[]): NormalizedRequirement[] {
    return candidates.map((req) => {
      const lower = (req.title + " " + req.description).toLowerCase();
      let canonicalDomain = "CORE_OPERATIONS";
      const normalizedKeywords: string[] = [];

      if (lower.includes("export") || lower.includes("excel") || lower.includes("spreadsheet") || lower.includes("download")) {
        canonicalDomain = "MEMBER_MANAGEMENT_DATA_EXPORT";
        normalizedKeywords.push("member_export", "excel_xlsx", "csv_download", "roster_reporting");
      } else if (lower.includes("attendance") || lower.includes("checkin")) {
        canonicalDomain = "ATTENDANCE_OPERATIONS";
        normalizedKeywords.push("mobile_checkin", "barcode_scan", "attendance_speed");
      } else if (lower.includes("remind") || lower.includes("expired")) {
        canonicalDomain = "RETENTION_AND_COMMUNICATION";
        normalizedKeywords.push("expiration_reminder", "automated_notifications", "membership_renewal");
      } else if (lower.includes("revenue") || lower.includes("financial")) {
        canonicalDomain = "FINANCIAL_REPORTING";
        normalizedKeywords.push("mrr_analytics", "revenue_report", "p_and_l_export");
      }

      return {
        ...req,
        canonicalDomain,
        normalizedKeywords,
      };
    });
  }
}
