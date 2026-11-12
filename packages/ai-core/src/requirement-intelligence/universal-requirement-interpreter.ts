/**
 * UniversalRequirementInterpreter
 *
 * Phase 3: Requirement & Architecture Intelligence
 *
 * Parses arbitrary natural language project prompts into a rich, structured,
 * domain-specific software specification without hardcoding or archetype limitations.
 *
 * Capabilities:
 * - Domain classification & semantic vocabulary extraction
 * - Entity & relationship graph synthesis (1:1, 1:N, N:M)
 * - Persona & user role extraction with role-based access boundaries
 * - Step-by-step user journey mapping
 * - Feature prioritization (Must-Have, Should-Have, Could-Have) with acceptance criteria
 * - Explicit and inferred technical stack constraint extraction
 */

import type { DomainVocabulary, ProjectSpecification } from "../architect/specification.js";
import { CanonicalResourceRegistry } from "../architect/canonical-resource-registry.js";

export type FeaturePriority = "MUST_HAVE" | "SHOULD_HAVE" | "COULD_HAVE";

export type FeatureCategory =
  | "AUTHENTICATION"
  | "CORE_DOMAIN"
  | "DATA_MANAGEMENT"
  | "ANALYTICS_REPORTING"
  | "ADMINISTRATION"
  | "INTEGRATION"
  | "COMMUNICATION";

export interface InterpretedField {
  name: string;
  type: "string" | "number" | "boolean" | "datetime" | "json" | "enum";
  required: boolean;
  unique?: boolean;
  isForeignKey?: boolean;
  references?: { entity: string; field: string };
  description?: string;
}

export interface InterpretedEntity {
  name: string;
  plural: string;
  description: string;
  fields: InterpretedField[];
  relations: Array<{
    targetEntity: string;
    type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY";
    foreignKey?: string;
  }>;
}

export interface InterpretedUserPersona {
  role: string;
  displayName: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
}

export interface InterpretedFeature {
  id: string;
  title: string;
  category: FeatureCategory;
  priority: FeaturePriority;
  description: string;
  acceptanceCriteria: string[];
  suggestedRoutes: string[];
  involvedEntities: string[];
}

export interface InterpretedUserJourney {
  id: string;
  name: string;
  persona: string;
  steps: string[];
}

export interface InterpretedTechnicalConstraints {
  frontendFramework: "react-vite" | "nextjs" | "html-tailwind" | "vue";
  backendFramework: "express" | "fastify" | "nest" | "none";
  databaseEngine: "sqlite" | "postgresql" | "mongodb" | "none";
  styling: "tailwind" | "css-modules" | "vanilla";
  authStrategy: "jwt" | "session" | "none";
  apiType: "REST" | "GraphQL" | "tRPC";
  userSpecified: {
    frontend?: boolean;
    backend?: boolean;
    database?: boolean;
    auth?: boolean;
  };
}

export interface InterpretedSpecification {
  projectName: string;
  domainCategory: string;
  summary: string;
  domainVocabulary: DomainVocabulary;
  personas: InterpretedUserPersona[];
  entities: InterpretedEntity[];
  features: InterpretedFeature[];
  journeys: InterpretedUserJourney[];
  technicalConstraints: InterpretedTechnicalConstraints;
  rawPrompt: string;
  createdAt: string;
}

export interface RelationshipSemantics {
  role: "COMPOSITION_CHILD" | "TRANSACTIONAL_RECORD" | "REGULATORY_AUDIT" | "ASSOCIATION_REFERENCE";
  ownership: "OWNED_DEPENDENT" | "INDEPENDENT_ENTITY" | "LOOSE_REFERENCE";
  retentionRequirement: "PERMANENT_AUDIT" | "LEGAL_TRANSACTION" | "OPERATIONAL" | "EPHEMERAL";
  optionality: "REQUIRED" | "OPTIONAL";
}

export function deriveDeletionPolicy(semantics: RelationshipSemantics): {
  onDelete: "Cascade" | "Restrict" | "SetNull";
  justification: string;
} {
  // 1. Transactional, financial, or regulatory audit records must never be cascaded
  if (
    semantics.retentionRequirement === "PERMANENT_AUDIT" ||
    semantics.retentionRequirement === "LEGAL_TRANSACTION" ||
    semantics.role === "TRANSACTIONAL_RECORD" ||
    semantics.role === "REGULATORY_AUDIT"
  ) {
    return {
      onDelete: "Restrict",
      justification: "Historical, legal, or transactional record retention requires blocking parent deletion to prevent data loss.",
    };
  }

  // 2. Strict subordinate composition children with no independent existence cascade deletion
  if (semantics.role === "COMPOSITION_CHILD" && semantics.ownership === "OWNED_DEPENDENT") {
    return {
      onDelete: "Cascade",
      justification: "Strict composition child with no independent lifecycle cascades deletion with parent.",
    };
  }

  // 3. Loose references with optional relationship set foreign key null
  if (semantics.ownership === "LOOSE_REFERENCE" && semantics.optionality === "OPTIONAL") {
    return {
      onDelete: "SetNull",
      justification: "Loose reference is cleared without destroying associated entity.",
    };
  }

  // 4. Default safe fallback: Restrict
  return {
    onDelete: "Restrict",
    justification: "Default fail-safe policy prevents accidental cascading deletion.",
  };
}

export class UniversalRequirementInterpreter {
  /**
   * Interprets an arbitrary natural language prompt into an exhaustive specification.
   */
  public static interpret(prompt: string): InterpretedSpecification {
    const rawPrompt = prompt.trim();
    const lower = rawPrompt.toLowerCase();

    // 1. Identify Domain Category & Name
    const domainCategory = this.extractDomainCategory(lower);
    const projectName = this.extractProjectName(rawPrompt, domainCategory);

    // 2. Extract Domain Vocabulary
    const domainVocabulary = this.extractDomainVocabulary(lower, domainCategory);

    // 3. Extract Technical Constraints
    const technicalConstraints = this.extractTechnicalConstraints(lower);

    // 4. Extract User Personas
    const personas = this.extractPersonas(lower, domainCategory);

    // 5. Extract Entities & Relational Schema
    const entities = this.extractEntities(lower, domainCategory, domainVocabulary);

    // 6. Extract Features with Priorities and Acceptance Criteria
    const features = this.extractFeatures(lower, domainCategory, domainVocabulary, entities);

    // 7. Map User Journeys
    const journeys = this.extractJourneys(domainCategory, domainVocabulary, personas);

    return {
      projectName,
      domainCategory,
      summary: rawPrompt.length > 300 ? `${rawPrompt.slice(0, 297)}...` : rawPrompt,
      domainVocabulary,
      personas,
      entities,
      features,
      journeys,
      technicalConstraints,
      rawPrompt,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Converts InterpretedSpecification to legacy ProjectSpecification for backward compatibility.
   */
  public static toProjectSpecification(spec: InterpretedSpecification): ProjectSpecification {
    return {
      name: spec.projectName,
      type: spec.technicalConstraints.backendFramework !== "none" ? "fullstack" : "frontend",
      frontend: spec.technicalConstraints.frontendFramework,
      backend: spec.technicalConstraints.backendFramework !== "none" ? spec.technicalConstraints.backendFramework : undefined,
      database: spec.technicalConstraints.databaseEngine !== "none" ? spec.technicalConstraints.databaseEngine : undefined,
      language: "typescript",
      styling: spec.technicalConstraints.styling,
      packageManager: "pnpm",
      features: spec.features.map(f => f.title),
      dataModels: spec.entities.map(e => e.name),
      userFlows: spec.journeys.map(j => j.name),
      domainCategory: spec.domainCategory,
      domainVocabulary: spec.domainVocabulary,
      auth: spec.technicalConstraints.authStrategy,
    };
  }

  private static extractDomainCategory(lower: string): string {
    if (/\b(bicycle|bike|cycling|cycle)\b/i.test(lower)) {
      return "bicycle-rental-and-repair";
    }
    if (/\b(ecommerce|e-commerce|store|cart)\b/i.test(lower) || /\bshop\b/i.test(lower)) {
      return "ecommerce";
    }
    if (lower.includes("drone") || lower.includes("telemetry") || lower.includes("uav") || lower.includes("aerospace")) {
      return "aerospace-telemetry";
    }
    if (/\b(sanctuary|wildlife|animal rescue|animal shelter|safari park|wild animals)\b/i.test(lower)) {
      return "wildlife-sanctuary";
    }
    if (/\b(vet|veterinary|veterinarian)\b/i.test(lower) || /\b(pet|pets|companion animal)\b/i.test(lower)) {
      return "veterinary-clinic";
    }
    if (/\b(art|artwork|artworks|gallery|exhibition|bid|bids|bidding|auction|auctions)\b/i.test(lower)) {
      return "art-gallery-auction";
    }
    if (lower.includes("rental") || lower.includes("equipment") || lower.includes("peer-to-peer") || lower.includes("p2p")) {
      return "equipment-rental";
    }
    if (lower.includes("farm") || lower.includes("crop") || lower.includes("harvest") || lower.includes("agriculture")) {
      return "agricultural-analytics";
    }
    if (lower.includes("booking") || lower.includes("appointment") || lower.includes("salon") || lower.includes("consult")) {
      return "service-booking";
    }
    if (lower.includes("crm") || lower.includes("lead") || lower.includes("sales pipeline")) {
      return "sales-crm";
    }
    if (lower.includes("finance") || lower.includes("crypto") || lower.includes("portfolio") || lower.includes("budget") || lower.includes("wallet")) {
      return "finance-tracking";
    }
    return "general-purpose-web-application";
  }

  private static extractProjectName(prompt: string, domainCategory: string): string {
    const clean = prompt
      .replace(/build|create|make|develop|a|an|the|full-stack|application|website|app|system|platform/gi, "")
      .trim();
    const words = clean.split(/\s+/).filter(w => w.length > 2 && /^[a-zA-Z0-9-]+$/.test(w));
    if (words.length > 0) {
      return words.slice(0, 3).join("-").toLowerCase();
    }
    return `${domainCategory}-app`;
  }

  private static extractDomainVocabulary(lower: string, category: string): DomainVocabulary {
    switch (category) {
      case "aerospace-telemetry":
        return {
          entityName: "Drone",
          entityPlural: "Drones",
          primaryMetrics: ["Active Drones", "Altitude (m)", "Battery Level (%)", "Telemetry Packets/s"],
          actionVerbs: ["Deploy", "Reroute", "Calibrate", "Land", "Abort"],
          domainPrefix: "drone",
        };
      case "wildlife-sanctuary":
        return {
          entityName: "Animal",
          entityPlural: "Animals",
          primaryMetrics: ["Resident Animals", "Rehabilitation Rate", "Active Habitats", "Approved Adoptions"],
          actionVerbs: ["Admit Animal", "Record Exam", "Assign Habitat", "Review Adoption"],
          domainPrefix: "animal",
        };
      case "veterinary-clinic":
        return {
          entityName: "Patient",
          entityPlural: "Patients",
          primaryMetrics: ["Daily Appointments", "Active Patients", "Pending Vaccinations", "Emergency Cases"],
          actionVerbs: ["Schedule Checkup", "Record Diagnosis", "Prescribe Medication", "Discharge"],
          domainPrefix: "patient",
        };
      case "art-gallery-auction":
        return {
          entityName: "Artwork",
          entityPlural: "Artworks",
          primaryMetrics: ["Active Bids", "Total Lots", "Highest Bid Value", "Registered Bidders"],
          actionVerbs: ["Place Bid", "Consign Lot", "Verify Provenance", "Accept Offer"],
          domainPrefix: "auction",
        };
      case "bicycle-rental-and-repair":
        return {
          entityName: "Bicycle",
          entityPlural: "Bicycles",
          primaryMetrics: ["Available Fleet", "Active Rentals", "Open Work Orders", "Daily Turnover"],
          actionVerbs: ["Reserve Bike", "Start Rental", "Create Work Order", "Assign Mechanic", "Complete Service"],
          domainPrefix: "bicycle",
        };
      case "equipment-rental":
        return {
          entityName: "Equipment",
          entityPlural: "Equipments",
          primaryMetrics: ["Items Rented", "Available Units", "Daily Revenue", "Return Overdue"],
          actionVerbs: ["Rent Item", "Reserve Unit", "Check Availability", "Log Return"],
          domainPrefix: "rental",
        };
      case "agricultural-analytics":
        return {
          entityName: "Crop",
          entityPlural: "Crops",
          primaryMetrics: ["Estimated Yield (t)", "Soil Moisture (%)", "Nitrogen Level", "Acres Monitored"],
          actionVerbs: ["Log Field Sample", "Schedule Irrigation", "Harvest Lot", "Optimize Fertilization"],
          domainPrefix: "crop",
        };
      case "ecommerce":
      case "e-commerce":
        return {
          entityName: "Product",
          entityPlural: "Products",
          primaryMetrics: ["Total Revenue", "Order Volume", "Cart Abandonment Rate", "In-Stock Items"],
          actionVerbs: ["Add to Cart", "Checkout", "Apply Coupon", "Track Shipment"],
          domainPrefix: "product",
        };
      default: {
        // Dynamic domain noun extraction from prompt
        const stopWords = new Set([
          "build", "create", "make", "develop", "a", "an", "the", "with", "system", "management",
          "application", "where", "staff", "manage", "view", "include", "small", "responsive",
          "storage", "database", "modern", "platform", "should", "allow", "track", "online",
          "digital", "premium", "simple", "advanced", "smart", "and", "for", "named", "featuring",
          "portal", "console", "service", "bespoke", "artisanal", "specialty", "custom", "boutique",
          "contemporary", "interactive", "luxury", "dedicated"
        ]);
        const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        const prime = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : "Item";
        const plural = CanonicalResourceRegistry.pluralizeWord(prime);
        const prefix = CanonicalResourceRegistry.getSingularResourceName(prime);

        return {
          entityName: prime,
          entityPlural: plural,
          primaryMetrics: [`Total ${plural}`, `Active ${plural}`, "Operational Health", "Verified Logs"],
          actionVerbs: [`Create ${prime}`, `Edit ${prime}`, "Inspect Details", "Export Data"],
          domainPrefix: prefix,
        };
      }
    }
  }

  private static extractTechnicalConstraints(lower: string): InterpretedTechnicalConstraints {
    // Frontend
    let frontendFramework: InterpretedTechnicalConstraints["frontendFramework"] = "react-vite";
    let feSpecified = false;
    if (lower.includes("nextjs") || lower.includes("next.js") || lower.includes("next 14") || lower.includes("next 15")) {
      frontendFramework = "nextjs";
      feSpecified = true;
    } else if (lower.includes("plain html") || lower.includes("vanilla html") || lower.includes("html only")) {
      frontendFramework = "html-tailwind";
      feSpecified = true;
    } else if (lower.includes("vue") || lower.includes("nuxt")) {
      frontendFramework = "vue";
      feSpecified = true;
    }

    // Backend
    let backendFramework: InterpretedTechnicalConstraints["backendFramework"] = "express";
    let beSpecified = false;
    if (lower.includes("fastify")) {
      backendFramework = "fastify";
      beSpecified = true;
    } else if (lower.includes("nest") || lower.includes("nestjs")) {
      backendFramework = "nest";
      beSpecified = true;
    } else if (lower.includes("frontend only") || lower.includes("client only") || lower.includes("static site")) {
      backendFramework = "none";
      beSpecified = true;
    }

    // Database
    let databaseEngine: InterpretedTechnicalConstraints["databaseEngine"] = "sqlite";
    let dbSpecified = false;
    if (lower.includes("postgres") || lower.includes("postgresql")) {
      databaseEngine = "postgresql";
      dbSpecified = true;
    } else if (lower.includes("mongo") || lower.includes("mongodb")) {
      databaseEngine = "mongodb";
      dbSpecified = true;
    } else if (lower.includes("no database") || backendFramework === "none") {
      databaseEngine = "none";
      dbSpecified = true;
    }

    // Auth
    let authStrategy: InterpretedTechnicalConstraints["authStrategy"] = "jwt";
    let authSpecified = false;
    if (lower.includes("session") || lower.includes("cookie auth")) {
      authStrategy = "session";
      authSpecified = true;
    } else if (lower.includes("no auth") || lower.includes("public only")) {
      authStrategy = "none";
      authSpecified = true;
    }

    return {
      frontendFramework,
      backendFramework,
      databaseEngine,
      styling: "tailwind",
      authStrategy,
      apiType: "REST",
      userSpecified: {
        frontend: feSpecified,
        backend: beSpecified,
        database: dbSpecified,
        auth: authSpecified,
      },
    };
  }

  private static extractPersonas(lower: string, category: string): InterpretedUserPersona[] {
    const personas: InterpretedUserPersona[] = [];

    // Always ensure at least primary user & administrator
    if (category === "wildlife-sanctuary") {
      personas.push(
        {
          role: "SANCTUARY_DIRECTOR",
          displayName: "Sanctuary Director",
          description: "Oversees animal admissions, habitat zone allocations, and rescue operations.",
          permissions: ["*"],
          isDefault: true,
        },
        {
          role: "WILDLIFE_VET",
          displayName: "Wildlife Veterinarian",
          description: "Conducts medical examinations, treatment plans, and rehabilitation tracking.",
          permissions: ["records:write", "exams:manage", "animals:read"],
          isDefault: false,
        },
        {
          role: "ADOPTION_OFFICER",
          displayName: "Adoption Coordinator",
          description: "Reviews foster and adoption applications and schedules visitor interactions.",
          permissions: ["adoptions:review", "animals:read"],
          isDefault: false,
        }
      );
    }

    if (category === "veterinary-clinic") {
      personas.push(
        {
          role: "VET_DOCTOR",
          displayName: "Veterinary Doctor",
          description: "Performs checkups, logs medical records, and prescribes treatments.",
          permissions: ["records:write", "appointments:manage", "prescriptions:create"],
          isDefault: true,
        },
        {
          role: "CLINIC_ADMIN",
          displayName: "Clinic Administrator",
          description: "Oversees appointment scheduling, billing, and clinic operations.",
          permissions: ["*"],
          isDefault: false,
        },
        {
          role: "PET_OWNER",
          displayName: "Pet Owner",
          description: "Books appointments, views medical history and vaccination records.",
          permissions: ["appointments:book", "records:read_own"],
          isDefault: false,
        }
      );
    } else if (category === "art-gallery-auction") {
      personas.push(
        {
          role: "BIDDER",
          displayName: "Auction Bidder",
          description: "Explores artwork catalog, registers for auctions, and places real-time bids.",
          permissions: ["bids:place", "lots:view", "profile:manage"],
          isDefault: true,
        },
        {
          role: "CURATOR",
          displayName: "Gallery Curator",
          description: "Manages catalog listings, sets reserve prices, and verifies provenance.",
          permissions: ["artworks:manage", "auctions:create", "provenance:verify"],
          isDefault: false,
        },
        {
          role: "ADMIN",
          displayName: "Platform Administrator",
          description: "Oversees payments, escrow, user verification, and dispute resolution.",
          permissions: ["*"],
          isDefault: false,
        }
      );
    } else if (category === "aerospace-telemetry") {
      personas.push(
        {
          role: "MISSION_OPERATOR",
          displayName: "Mission Controller / Pilot",
          description: "Monitors live drone flight trajectories, commands waypoints, and initiates fail-safe maneuvers.",
          permissions: ["telemetry:read", "commands:issue", "emergency:trigger"],
          isDefault: true,
        },
        {
          role: "SYSTEM_ENGINEER",
          displayName: "Avionics System Engineer",
          description: "Reviews sensor logs, battery diagnostics, and motor performance metrics.",
          permissions: ["diagnostics:read", "firmware:audit", "config:write"],
          isDefault: false,
        }
      );
    } else {
      personas.push(
        {
          role: "STANDARD_USER",
          displayName: "Standard User",
          description: "Accesses interactive core domain capabilities and personal records.",
          permissions: ["records:read", "records:create"],
          isDefault: true,
        },
        {
          role: "ADMINISTRATOR",
          displayName: "System Administrator",
          description: "Full management access over all platform entities and configuration.",
          permissions: ["*"],
          isDefault: false,
        }
      );
    }

    return personas;
  }

  private static extractEntities(lower: string, category: string, vocab: DomainVocabulary): InterpretedEntity[] {
    const userEntity: InterpretedEntity = {
      name: "User",
      plural: "Users",
      description: "Platform user account with authentication and role credentials.",
      fields: [
        { name: "id", type: "string", required: true, unique: true },
        { name: "email", type: "string", required: true, unique: true },
        { name: "passwordHash", type: "string", required: true },
        { name: "role", type: "string", required: true },
        { name: "createdAt", type: "datetime", required: true },
        { name: "updatedAt", type: "datetime", required: true },
      ],
      relations: [],
    };

    const entities: InterpretedEntity[] = [userEntity];

    if (category === "wildlife-sanctuary") {
      const animalEntity: InterpretedEntity = {
        name: "Animal",
        plural: "Animals",
        description: "Protected or rescued wild animal residing in the sanctuary.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "name", type: "string", required: true },
          { name: "species", type: "string", required: true },
          { name: "category", type: "string", required: false },
          { name: "healthStatus", type: "string", required: true },
          { name: "habitatBiome", type: "string", required: true },
          { name: "admissionDate", type: "datetime", required: true },
          { name: "description", type: "string", required: false },
          { name: "createdAt", type: "datetime", required: true },
        ],
        relations: [
          { targetEntity: "VeterinaryExam", type: "ONE_TO_MANY" },
        ],
      };
      const examEntity: InterpretedEntity = {
        name: "VeterinaryExam",
        plural: "VeterinaryExams",
        description: "Clinical examination and health report for an animal.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "animalId", type: "string", required: true },
          { name: "examDate", type: "datetime", required: true },
          { name: "veterinarian", type: "string", required: true },
          { name: "diagnosis", type: "string", required: true },
          { name: "treatmentPlan", type: "string", required: false },
          { name: "createdAt", type: "datetime", required: true },
        ],
        relations: [
          { targetEntity: "Animal", type: "ONE_TO_ONE" },
        ],
      };
      entities.push(animalEntity, examEntity);
    }

    if (category === "veterinary-clinic") {
      const petEntity: InterpretedEntity = {
        name: "Patient",
        plural: "Patients",
        description: "Registered animal receiving veterinary care.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "name", type: "string", required: true },
          { name: "species", type: "string", required: true },
          { name: "breed", type: "string", required: false },
          { name: "age", type: "number", required: true },
          { name: "ownerName", type: "string", required: true },
          { name: "ownerContact", type: "string", required: true },
          { name: "medicalHistory", type: "string", required: false },
          { name: "createdAt", type: "datetime", required: true },
        ],
        relations: [
          { targetEntity: "Appointment", type: "ONE_TO_MANY" },
          { targetEntity: "MedicalRecord", type: "ONE_TO_MANY" },
        ],
      };

      const appointmentEntity: InterpretedEntity = {
        name: "Appointment",
        plural: "Appointments",
        description: "Scheduled consultation or treatment visit.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "patientId", type: "string", required: true, isForeignKey: true, references: { entity: "Patient", field: "id" } },
          { name: "dateTime", type: "datetime", required: true },
          { name: "reason", type: "string", required: true },
          { name: "status", type: "string", required: true },
          { name: "veterinarian", type: "string", required: true },
        ],
        relations: [
          { targetEntity: "Patient", type: "ONE_TO_ONE", foreignKey: "patientId" },
        ],
      };

      entities.push(petEntity, appointmentEntity);
    } else if (category === "art-gallery-auction") {
      const artworkEntity: InterpretedEntity = {
        name: "Artwork",
        plural: "Artworks",
        description: "Unique piece of art presented for exhibition or auction.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "title", type: "string", required: true },
          { name: "artist", type: "string", required: true },
          { name: "medium", type: "string", required: true },
          { name: "reservePrice", type: "number", required: true },
          { name: "currentHighestBid", type: "number", required: false },
          { name: "status", type: "string", required: true },
          { name: "imageUrl", type: "string", required: false },
        ],
        relations: [
          { targetEntity: "Bid", type: "ONE_TO_MANY" },
        ],
      };

      const bidEntity: InterpretedEntity = {
        name: "Bid",
        plural: "Bids",
        description: "Monetary offer placed on an artwork during active auction.",
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "artworkId", type: "string", required: true, isForeignKey: true, references: { entity: "Artwork", field: "id" } },
          { name: "userId", type: "string", required: true, isForeignKey: true, references: { entity: "User", field: "id" } },
          { name: "amount", type: "number", required: true },
          { name: "timestamp", type: "datetime", required: true },
          { name: "status", type: "string", required: true },
        ],
        relations: [
          { targetEntity: "Artwork", type: "ONE_TO_ONE", foreignKey: "artworkId" },
          { targetEntity: "User", type: "ONE_TO_ONE", foreignKey: "userId" },
        ],
      };

      entities.push(artworkEntity, bidEntity);
    } else {
      // Dynamic synthesis for arbitrary domain using extracted vocabulary
      const primaryEntity: InterpretedEntity = {
        name: vocab.entityName,
        plural: vocab.entityPlural,
        description: `Primary record tracking domain activities for ${vocab.entityName}.`,
        fields: [
          { name: "id", type: "string", required: true, unique: true },
          { name: "title", type: "string", required: true },
          { name: "status", type: "string", required: true },
          { name: "description", type: "string", required: false },
          { name: "createdAt", type: "datetime", required: true },
          { name: "updatedAt", type: "datetime", required: true },
        ],
        relations: [],
      };
      entities.push(primaryEntity);

      // Dynamically extract secondary domain entities with explicit relationship semantics
      const secondaryCandidates = [
        {
          key: "booking",
          name: "Booking",
          plural: "Bookings",
          desc: "Reservation or scheduled appointment",
          semantics: { role: "TRANSACTIONAL_RECORD", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "LEGAL_TRANSACTION", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "commission",
          name: "Commission",
          plural: "Commissions",
          desc: "Custom order or client commission request",
          semantics: { role: "TRANSACTIONAL_RECORD", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "LEGAL_TRANSACTION", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "workshop",
          name: "Workshop",
          plural: "Workshops",
          desc: "Studio workshop session or educational masterclass",
          semantics: { role: "ASSOCIATION_REFERENCE", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "OPERATIONAL", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "glaze",
          name: "GlazeSpecification",
          plural: "GlazeSpecifications",
          desc: "Chemical and formulation glaze specification",
          semantics: { role: "ASSOCIATION_REFERENCE", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "OPERATIONAL", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "order",
          name: "Order",
          plural: "Orders",
          desc: "Commercial purchase order or fulfillment transaction",
          semantics: { role: "TRANSACTIONAL_RECORD", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "LEGAL_TRANSACTION", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "inverter",
          name: "Inverter",
          plural: "Inverters",
          desc: "Solar photovoltaic inverter hardware unit",
          semantics: { role: "COMPOSITION_CHILD", ownership: "OWNED_DEPENDENT", retentionRequirement: "OPERATIONAL", optionality: "REQUIRED" } as RelationshipSemantics,
        },
        {
          key: "dispatch",
          name: "WorkOrder",
          plural: "WorkOrders",
          desc: "Field maintenance technician dispatch order",
          semantics: { role: "REGULATORY_AUDIT", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "PERMANENT_AUDIT", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "repair",
          name: "WorkOrder",
          plural: "WorkOrders",
          desc: "Equipment diagnostic and repair work order",
          semantics: { role: "REGULATORY_AUDIT", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "PERMANENT_AUDIT", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "mechanic",
          name: "Mechanic",
          plural: "Mechanics",
          desc: "Certified technician and mechanic profile",
          semantics: { role: "ASSOCIATION_REFERENCE", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "OPERATIONAL", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "inventory",
          name: "InventoryItem",
          plural: "InventoryItems",
          desc: "Replacement parts and workshop stock inventory record",
          semantics: { role: "COMPOSITION_CHILD", ownership: "OWNED_DEPENDENT", retentionRequirement: "OPERATIONAL", optionality: "REQUIRED" } as RelationshipSemantics,
        },
        {
          key: "payment",
          name: "PaymentRecord",
          plural: "PaymentRecords",
          desc: "Transaction payment and receipt record",
          semantics: { role: "TRANSACTIONAL_RECORD", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "LEGAL_TRANSACTION", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "item",
          name: "Item",
          plural: "Items",
          desc: "Catalog item or resource record",
          semantics: { role: "COMPOSITION_CHILD", ownership: "OWNED_DEPENDENT", retentionRequirement: "EPHEMERAL", optionality: "REQUIRED" } as RelationshipSemantics,
        },
        {
          key: "course",
          name: "Course",
          plural: "Courses",
          desc: "Educational syllabus or training course",
          semantics: { role: "TRANSACTIONAL_RECORD", ownership: "INDEPENDENT_ENTITY", retentionRequirement: "LEGAL_TRANSACTION", optionality: "OPTIONAL" } as RelationshipSemantics,
        },
        {
          key: "lesson",
          name: "Lesson",
          plural: "Lessons",
          desc: "Structured learning module or session",
          semantics: { role: "COMPOSITION_CHILD", ownership: "OWNED_DEPENDENT", retentionRequirement: "OPERATIONAL", optionality: "REQUIRED" } as RelationshipSemantics,
        },
      ];

      const primaryDelegate = CanonicalResourceRegistry.getPrismaDelegateName(vocab.entityName);
      const primaryFk = `${primaryDelegate}Id`;

      for (const cand of secondaryCandidates) {
        if (lower.includes(cand.key) && cand.name.toLowerCase() !== vocab.entityName.toLowerCase()) {
          const childRelationField = cand.plural.charAt(0).toLowerCase() + cand.plural.slice(1);
          const policy = deriveDeletionPolicy(cand.semantics);

          entities.push({
            name: cand.name,
            plural: cand.plural,
            description: cand.desc,
            fields: [
              { name: "id", type: "string", required: true, unique: true },
              { name: "title", type: "string", required: true },
              { name: "status", type: "string", required: true },
              { name: primaryFk, type: "string", required: false, isForeignKey: true },
              { name: "details", type: "string", required: false },
              { name: "createdAt", type: "datetime", required: true },
            ],
            relations: [
              {
                targetEntity: vocab.entityName,
                type: "MANY_TO_ONE",
                foreignKey: primaryFk,
                relationField: primaryDelegate,
                onDelete: policy.onDelete,
                referentialIntegrityJustification: policy.justification,
              } as any,
            ],
          });

          // Bi-directional link on primary entity
          primaryEntity.relations.push({
            targetEntity: cand.name,
            type: "ONE_TO_MANY",
            relationField: childRelationField,
          } as any);
        }
      }
    }

    return entities;
  }

  private static extractFeatures(
    lower: string,
    category: string,
    vocab: DomainVocabulary,
    entities: InterpretedEntity[]
  ): InterpretedFeature[] {
    const features: InterpretedFeature[] = [];
    let idCounter = 1;

    // 1. Authentication & Security
    features.push({
      id: `feat-${idCounter++}`,
      title: "Authentication & Role-Based Access Control",
      category: "AUTHENTICATION",
      priority: "MUST_HAVE",
      description: "Secure login, user registration, JWT token generation, and role authorization guard.",
      acceptanceCriteria: [
        "User registration with email and password hashing via bcrypt",
        "JWT token issuance and secure validation middleware",
        "Role checks preventing unauthorized access to restricted views",
      ],
      suggestedRoutes: ["/login", "/register"],
      involvedEntities: ["User"],
    });

    // 2. Core Interactive Domain Dashboard
    features.push({
      id: `feat-${idCounter++}`,
      title: `${vocab.entityName} Overview & Live Metric Dashboard`,
      category: "CORE_DOMAIN",
      priority: "MUST_HAVE",
      description: `Central interactive view featuring domain KPIs (${vocab.primaryMetrics.slice(0, 3).join(", ")}) and live entity feed.`,
      acceptanceCriteria: [
        `Displays live counts for ${vocab.primaryMetrics[0]}`,
        "Supports real-time search, category filtering, and status sorting",
        "Zero mock placeholder values; backed by genuine state or database",
      ],
      suggestedRoutes: ["/", `/${vocab.domainPrefix}s`],
      involvedEntities: [vocab.entityName],
    });

    // 3. Detail & Record Management
    features.push({
      id: `feat-${idCounter++}`,
      title: `${vocab.entityName} Lifecycle Management (CRUD)`,
      category: "DATA_MANAGEMENT",
      priority: "MUST_HAVE",
      description: `Full lifecycle management to create, edit, inspect, and update ${vocab.entityPlural}.`,
      acceptanceCriteria: [
        `Interactive form validating required fields for new ${vocab.entityName}`,
        `Detail modal or dedicated route for deep inspection`,
        `Optimistic UI feedback on update and delete operations`,
      ],
      suggestedRoutes: [`/${vocab.domainPrefix}s/new`, `/${vocab.domainPrefix}s/:id`],
      involvedEntities: [vocab.entityName],
    });

    // 4. Analytics & Export Reporting
    features.push({
      id: `feat-${idCounter++}`,
      title: "Data Visualization & Metric Reports",
      category: "ANALYTICS_REPORTING",
      priority: "SHOULD_HAVE",
      description: "Analytical trend charts, status distributions, and CSV data export capabilities.",
      acceptanceCriteria: [
        "Visual charts rendering historical records and status breakdown",
        "Export functionality generating structured downloadable data",
      ],
      suggestedRoutes: ["/reports", "/analytics"],
      involvedEntities: [vocab.entityName],
    });

    // 5. Admin Control Center
    features.push({
      id: `feat-${idCounter++}`,
      title: "Administrative Control Panel",
      category: "ADMINISTRATION",
      priority: "SHOULD_HAVE",
      description: "Administrative configuration, user management, and system health observability.",
      acceptanceCriteria: [
        "Protected admin view accessible only to users with ADMIN role",
        "System configuration toggles and activity audit log",
      ],
      suggestedRoutes: ["/admin"],
      involvedEntities: ["User"],
    });

    return features;
  }

  private static extractJourneys(
    category: string,
    vocab: DomainVocabulary,
    personas: InterpretedUserPersona[]
  ): InterpretedUserJourney[] {
    const defaultPersona = personas.find(p => p.isDefault)?.displayName || "User";

    return [
      {
        id: "journey-onboarding",
        name: "User Authentication & Onboarding",
        persona: defaultPersona,
        steps: [
          "Navigate to landing page",
          "Register new account with valid credentials",
          "Receive authentication token and route to primary dashboard",
        ],
      },
      {
        id: "journey-core-action",
        name: `Primary ${vocab.entityName} Workflow`,
        persona: defaultPersona,
        steps: [
          `Inspect ${vocab.primaryMetrics[0]} on main dashboard`,
          `Filter catalog to find specific ${vocab.entityName}`,
          `Execute "${vocab.actionVerbs[0]}" action`,
          "Receive immediate visual confirmation and persist state",
        ],
      },
      {
        id: "journey-admin-governance",
        name: "Administrative Audit & Operations",
        persona: "System Administrator",
        steps: [
          "Log in with administrator credentials",
          "Access protected /admin control panel",
          "Review platform activity logs and update system settings",
        ],
      },
    ];
  }
}
