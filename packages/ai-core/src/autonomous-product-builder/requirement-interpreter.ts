/**
 * RequirementInterpreter
 *
 * Converts natural-language prompt requirements into structured, classified requirement specifications.
 * Tracks requirement derivation source: EXPLICIT, INFERRED, or ASSUMED.
 */

import { type RequirementCategory } from "../product-completion/requirement-contract-registry.js";

export type RequirementDerivation = "EXPLICIT" | "INFERRED" | "ASSUMED";

export interface ParsedRequirementSpec {
  requirementId: string;
  title: string;
  category: RequirementCategory;
  description: string;
  acceptanceCriteria: string[];
  derivation: RequirementDerivation;
  isCritical: boolean;
}


export class RequirementInterpreter {
  public static interpretPrompt(prompt: string): ParsedRequirementSpec[] {
    const p = prompt.toLowerCase();
    const specs: ParsedRequirementSpec[] = [];
    let counter = 1;

    const addReq = (
      title: string,
      category: ParsedRequirementSpec["category"],
      description: string,
      criteria: string[],
      derivation: RequirementDerivation,
      isCritical: boolean
    ) => {
      const id = `REQ-${String(counter++).padStart(3, "0")}`;
      specs.push({
        requirementId: id,
        title,
        category,
        description,
        acceptanceCriteria: criteria,
        derivation,
        isCritical,
      });
    };

    // 1. Authentication
    if (p.includes("auth") || p.includes("login") || p.includes("admin") || p.includes("user")) {
      addReq(
        "User & Staff Authentication",
        "AUTHENTICATION",
        "Role-based authentication system with JWT tokens and protected routes.",
        ["Login form renders", "Valid credentials issue JWT", "Protected routes reject unauthenticated requests"],
        p.includes("auth") || p.includes("login") ? "EXPLICIT" : "INFERRED",
        true
      );
    }

    // 2. Admin Panel & Dashboard
    if (p.includes("dashboard") || p.includes("admin")) {
      addReq(
        "Admin Dashboard & Metrics",
        "UI_UX",
        "Visual administrative overview displaying system activity, key KPIs, and quick actions.",
        ["KPI summary cards visible", "Real-time stats update on mutation", "Responsive grid layout"],
        p.includes("dashboard") || p.includes("admin") ? "EXPLICIT" : "INFERRED",
        true
      );
    }

    // 3. Member Management
    if (p.includes("member") || p.includes("gym") || p.includes("customer")) {
      addReq(
        "Member Management & Directory",
        "FUNCTIONAL",
        "CRUD capabilities for customer/member records with membership plan tracking.",
        ["Add member modal with validation", "Member list displays active members", "Member search & filter works"],
        p.includes("member") ? "EXPLICIT" : "INFERRED",
        true
      );
    }

    // 4. Trainer / Staff Management
    if (p.includes("trainer") || p.includes("staff") || p.includes("instructor")) {
      addReq(
        "Trainer & Staff Roster",
        "FUNCTIONAL",
        "Directory of trainers and staff members with specialization and schedule management.",
        ["Add trainer with specialty", "Trainer assignments persist to DB", "Trainer active roster renders"],
        p.includes("trainer") || p.includes("staff") ? "EXPLICIT" : "INFERRED",
        false
      );
    }

    // 5. Attendance Tracking
    if (p.includes("attendance") || p.includes("check-in") || p.includes("gym")) {
      addReq(
        "Member Check-in & Attendance",
        "FUNCTIONAL",
        "Real-time attendance logging and daily check-in verification.",
        ["Check-in button increments daily count", "Attendance log records timestamp", "Duplicate check-ins handled"],
        p.includes("attendance") || p.includes("check-in") ? "EXPLICIT" : "INFERRED",
        true
      );
    }

    // 6. Payments & Billing
    if (p.includes("payment") || p.includes("billing") || p.includes("subscription")) {
      addReq(
        "Payment Processing & Invoicing",
        "FUNCTIONAL",
        "Subscription billing, payment recording, and invoice generation.",
        ["Payment transaction form with amount & method", "Payment records persist", "Invoice receipt generated"],
        p.includes("payment") || p.includes("billing") ? "EXPLICIT" : "INFERRED",
        true
      );
    }

    // 7. Database Persistence
    addReq(
      "Relational Database Persistence",
      "DATABASE",
      "Normalized database schema with relations, indexes, and connection pooling.",
      ["Prisma schema matches domain models", "Migrations apply cleanly", "Data persists across restarts"],
      "ASSUMED",
      true
    );

    // 8. REST API Endpoints
    addReq(
      "RESTful API Contracts",
      "API",
      "Structured REST API routes for all frontend data queries and mutations.",
      ["Standard HTTP status codes (200, 201, 400, 401, 404, 500)", "JSON request and response shapes match contracts"],
      "ASSUMED",
      true
    );

    return specs;
  }
}
