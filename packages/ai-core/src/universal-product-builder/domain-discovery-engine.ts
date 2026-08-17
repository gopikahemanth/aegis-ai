/**
 * DomainDiscoveryEngine
 *
 * Discovers the domain archetype of an application from natural language requirements without restricting custom features.
 * Invariant: DOMAIN DETECTION != DOMAIN RESTRICTION. Unknown or ambiguous domains fall back to "CUSTOM".
 */

export type ProductDomain =
  | "ECOMMERCE"
  | "CRM"
  | "HEALTHCARE"
  | "EDUCATION"
  | "BOOKING"
  | "FINANCE"
  | "SOCIAL"
  | "PROJECT_MANAGEMENT"
  | "GYM_MANAGEMENT"
  | "SAAS"
  | "CUSTOM";

export interface DiscoveredDomainInfo {
  domain: ProductDomain;
  confidence: number;
  detectedKeywords: string[];
  suggestedArchetype: string;
  isCustomFallback: boolean;
}

export class DomainDiscoveryEngine {
  public static discoverDomain(prompt: string): DiscoveredDomainInfo {
    const p = prompt.toLowerCase();

    const matches = (keywords: string[]) => keywords.filter((k) => p.includes(k));

    // E-commerce
    const ecomKw = matches(["shop", "store", "cart", "product", "checkout", "order", "ecommerce", "e-commerce", "stripe"]);
    if (ecomKw.length >= 2 || p.includes("ecommerce") || p.includes("e-commerce")) {
      return {
        domain: "ECOMMERCE",
        confidence: Math.min(0.6 + ecomKw.length * 0.1, 0.98),
        detectedKeywords: ecomKw,
        suggestedArchetype: "Online Retail & Storefront",
        isCustomFallback: false,
      };
    }

    // LMS / Education
    const eduKw = matches(["course", "lesson", "student", "teacher", "instructor", "lms", "assignment", "grade", "quiz", "learning"]);
    if (eduKw.length >= 2 || p.includes("lms") || p.includes("learning platform")) {
      return {
        domain: "EDUCATION",
        confidence: Math.min(0.6 + eduKw.length * 0.1, 0.98),
        detectedKeywords: eduKw,
        suggestedArchetype: "Learning Management System (LMS)",
        isCustomFallback: false,
      };
    }

    // CRM
    const crmKw = matches(["crm", "lead", "pipeline", "deal", "opportunity", "contact", "salesrep", "customer relation"]);
    if (crmKw.length >= 2 || p.includes("crm")) {
      return {
        domain: "CRM",
        confidence: Math.min(0.6 + crmKw.length * 0.1, 0.98),
        detectedKeywords: crmKw,
        suggestedArchetype: "Customer Relationship Management (CRM)",
        isCustomFallback: false,
      };
    }

    // Healthcare
    const healthKw = matches(["hospital", "patient", "doctor", "clinic", "medical", "appointment", "prescription", "health"]);
    if (healthKw.length >= 2 || p.includes("hospital") || p.includes("clinic")) {
      return {
        domain: "HEALTHCARE",
        confidence: Math.min(0.6 + healthKw.length * 0.1, 0.98),
        detectedKeywords: healthKw,
        suggestedArchetype: "Clinical Healthcare & Patient Management",
        isCustomFallback: false,
      };
    }

    // Booking
    const bookKw = matches(["booking", "reservation", "schedule", "hotel", "flight", "seat", "slot", "calendar"]);
    if (bookKw.length >= 2 || p.includes("booking platform")) {
      return {
        domain: "BOOKING",
        confidence: Math.min(0.6 + bookKw.length * 0.1, 0.98),
        detectedKeywords: bookKw,
        suggestedArchetype: "Service & Resource Booking Platform",
        isCustomFallback: false,
      };
    }

    // Gym
    const gymKw = matches(["gym", "trainer", "workout", "fitness", "attendance", "membership"]);
    if (gymKw.length >= 2 || p.includes("gym")) {
      return {
        domain: "GYM_MANAGEMENT",
        confidence: Math.min(0.6 + gymKw.length * 0.1, 0.98),
        detectedKeywords: gymKw,
        suggestedArchetype: "Gym & Fitness Club Operations",
        isCustomFallback: false,
      };
    }

    // SaaS
    const saasKw = matches(["saas", "subscription", "tenant", "workspace", "billing", "api-key"]);
    if (saasKw.length >= 2 || p.includes("saas")) {
      return {
        domain: "SAAS",
        confidence: Math.min(0.6 + saasKw.length * 0.1, 0.98),
        detectedKeywords: saasKw,
        suggestedArchetype: "Multi-Tenant SaaS Application",
        isCustomFallback: false,
      };
    }

    // Fallback: Custom Application
    return {
      domain: "CUSTOM",
      confidence: 0.85,
      detectedKeywords: ["custom-specification"],
      suggestedArchetype: "Custom Universal Application",
      isCustomFallback: true,
    };
  }
}
