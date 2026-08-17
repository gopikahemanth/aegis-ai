/**
 * ProductRequirementAnalyzer
 *
 * Converts natural-language user requests into structured ProductSpecification objects.
 * Identifies explicit vs inferred requirements with confidence levels and generates
 * deterministic productSpecificationHash.
 */

import { createHash } from "node:crypto";

export interface RequirementItem {
  id: string;
  category: "feature" | "entity" | "workflow" | "auth" | "ui" | "api" | "database" | "security" | "performance";
  description: string;
  source: "EXPLICIT" | "INFERRED" | "OPTIONAL" | "UNKNOWN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  inferenceReason?: string;
}

export interface ProductSpecification {
  version: 1;
  productGoal: string;
  targetUsers: string[];
  userRoles: string[];
  entities: string[];
  features: string[];
  requirements: RequirementItem[];
  productSpecificationHash: string;
}

export class ProductRequirementAnalyzer {
  public static analyze(userPrompt: string): ProductSpecification {
    const promptLower = userPrompt.toLowerCase();
    const requirements: RequirementItem[] = [];
    const entities: string[] = ["User"];
    const features: string[] = ["auth"];
    const userRoles: string[] = ["User", "Admin"];

    // 1. Explicit Feature & Entity Extraction
    if (promptLower.includes("gym") || promptLower.includes("member")) {
      entities.push("Member", "Trainer");
      features.push("members", "trainers");
      requirements.push({
        id: "req_members",
        category: "feature",
        description: "Member management and profiles",
        source: "EXPLICIT",
        confidence: "HIGH",
      });
      requirements.push({
        id: "req_trainers",
        category: "feature",
        description: "Trainer management and assignments",
        source: "EXPLICIT",
        confidence: "HIGH",
      });
    }

    if (promptLower.includes("attendance") || promptLower.includes("check-in") || promptLower.includes("checkin")) {
      entities.push("MemberAttendance");
      features.push("attendance");
      requirements.push({
        id: "req_attendance",
        category: "feature",
        description: "Track attendance and check-in records",
        source: "EXPLICIT",
        confidence: "HIGH",
      });
    }

    if (promptLower.includes("workout") || promptLower.includes("exercise")) {
      entities.push("Workout");
      features.push("workouts");
      requirements.push({
        id: "req_workouts",
        category: "feature",
        description: "Workout tracking and exercise routines",
        source: "EXPLICIT",
        confidence: "HIGH",
      });
    }

    // 2. Inferred Requirements
    requirements.push({
      id: "req_auth_inferred",
      category: "auth",
      description: "JWT Authentication for staff / member identification",
      source: "INFERRED",
      confidence: "HIGH",
      inferenceReason: "Required to identify and authenticate staff and members accessing protected resources.",
    });

    requirements.push({
      id: "req_db_inferred",
      category: "database",
      description: "Relational database schema for entities and relationships",
      source: "INFERRED",
      confidence: "HIGH",
      inferenceReason: "Persistent storage required for relational business entities.",
    });

    // 3. Compute Deterministic Hash
    const rawData = {
      productGoal: userPrompt.trim(),
      userRoles: userRoles.sort(),
      entities: Array.from(new Set(entities)).sort(),
      features: Array.from(new Set(features)).sort(),
      requirements: requirements.map((r) => ({ id: r.id, category: r.category, desc: r.description, src: r.source })),
    };

    const hash = createHash("sha256").update(JSON.stringify(rawData)).digest("hex").slice(0, 12);

    return {
      version: 1,
      productGoal: userPrompt.trim(),
      targetUsers: ["Gym Staff", "Members", "Trainers"],
      userRoles,
      entities: Array.from(new Set(entities)),
      features: Array.from(new Set(features)),
      requirements,
      productSpecificationHash: hash,
    };
  }
}
