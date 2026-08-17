/**
 * BusinessLogicGenerationEngine
 *
 * Implements and enforces rich domain rules beyond basic CRUD (e.g. inventory depletion guards,
 * double-booking prevention, membership active status checks, assignment deadline locks).
 */

export interface DomainBusinessRule {
  ruleId: string;
  domain: string;
  name: string;
  description: string;
  guardFunction: string;
  isEnforced: boolean;
}

export class BusinessLogicGenerationEngine {
  public static deriveBusinessRules(domain: string): DomainBusinessRule[] {
    const d = domain.toLowerCase();

    if (d.includes("ecom") || d.includes("shop")) {
      return [
        {
          ruleId: "BR-ECOM-001",
          domain: "ECOMMERCE",
          name: "Non-Negative Stock Guard",
          description: "Inventory stock count cannot be decremented below zero on checkout.",
          guardFunction: "assertSufficientInventory(productId, quantity)",
          isEnforced: true,
        },
        {
          ruleId: "BR-ECOM-002",
          domain: "ECOMMERCE",
          name: "Order State Transition Machine",
          description: "Order status must transition strictly PENDING -> PAID -> SHIPPED -> DELIVERED.",
          guardFunction: "assertValidOrderTransition(currentStatus, nextStatus)",
          isEnforced: true,
        },
      ];
    }

    if (d.includes("book") || d.includes("appoint")) {
      return [
        {
          ruleId: "BR-BOOK-001",
          domain: "BOOKING",
          name: "Double Booking Prevention",
          description: "Overlapping appointment reservations for the same resource/slot are blocked.",
          guardFunction: "assertNoSlotCollision(resourceId, startTime, endTime)",
          isEnforced: true,
        },
      ];
    }

    if (d.includes("gym")) {
      return [
        {
          ruleId: "BR-GYM-001",
          domain: "GYM_MANAGEMENT",
          name: "Active Membership Attendance Guard",
          description: "Check-in is permitted only if membership status is ACTIVE and unexpired.",
          guardFunction: "assertActiveMembership(memberId)",
          isEnforced: true,
        },
      ];
    }

    if (d.includes("edu") || d.includes("lms")) {
      return [
        {
          ruleId: "BR-LMS-001",
          domain: "EDUCATION",
          name: "Assignment Deadline Lock",
          description: "Submissions submitted past strict deadline are rejected unless late flag enabled.",
          guardFunction: "assertSubmissionWithinDeadline(assignmentId, timestamp)",
          isEnforced: true,
        },
      ];
    }

    // Default Custom Business Invariant
    return [
      {
        ruleId: "BR-GEN-001",
        domain: "CUSTOM",
        name: "Record Uniqueness & Non-Empty Guard",
        description: "Primary entities must satisfy uniqueness and required non-empty attribute guards.",
        guardFunction: "assertEntityInvariants(entity)",
        isEnforced: true,
      },
    ];
  }
}
