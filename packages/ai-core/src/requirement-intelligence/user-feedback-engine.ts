/**
 * UserFeedbackEngine
 *
 * Processes unstructured user feedback, support requests, and feature suggestions,
 * extracting core desired capabilities, affected user roles, and problem statements.
 */

export interface ParsedFeedbackItem {
  id: string;
  rawText: string;
  desiredCapability: string;
  affectedRole: string;
  identifiedProblem: string;
  expectedOutcome: string;
  priorityHint: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export class UserFeedbackEngine {
  public static parseFeedback(feedbackTexts: string[]): ParsedFeedbackItem[] {
    return feedbackTexts.map((text, idx) => {
      const lower = text.toLowerCase();
      let desiredCapability = "General Enhancement";
      let affectedRole = "General User";
      let identifiedProblem = "Workflow inconvenience";
      let expectedOutcome = "Improved product usability";
      let priorityHint: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";

      if (lower.includes("export") || lower.includes("excel") || lower.includes("spreadsheet") || lower.includes("download member")) {
        desiredCapability = "Member Data Bulk Export (Excel / CSV)";
        affectedRole = "Gym Manager";
        identifiedProblem = "Manual repeated data extraction causes administrative friction";
        expectedOutcome = "Instant filtered export of member rosters with 0 manual copying";
        priorityHint = "HIGH";
      } else if (lower.includes("attendance") || lower.includes("mobile")) {
        desiredCapability = "Fast Mobile Attendance Check-in";
        affectedRole = "Frontdesk Staff";
        identifiedProblem = "Mobile attendance check-in is sluggish on small viewports";
        expectedOutcome = "1-click barcode/member check-in on mobile staff devices";
        priorityHint = "HIGH";
      } else if (lower.includes("remind") || lower.includes("expired")) {
        desiredCapability = "Automated Membership Expiration Reminders";
        affectedRole = "Member & Manager";
        identifiedProblem = "Members lapse without timely notification";
        expectedOutcome = "Automated SMS/Email renewal reminders before expiration date";
        priorityHint = "MEDIUM";
      } else if (lower.includes("revenue") || lower.includes("report")) {
        desiredCapability = "Monthly Revenue Analytics Report";
        affectedRole = "Gym Owner";
        identifiedProblem = "Lack of aggregated financial visibility across billing cycles";
        expectedOutcome = "Downloadable P&L summary and monthly recurring revenue chart";
        priorityHint = "HIGH";
      }

      return {
        id: `fb_parsed_${idx + 1}`,
        rawText: text,
        desiredCapability,
        affectedRole,
        identifiedProblem,
        expectedOutcome,
        priorityHint,
      };
    });
  }
}
