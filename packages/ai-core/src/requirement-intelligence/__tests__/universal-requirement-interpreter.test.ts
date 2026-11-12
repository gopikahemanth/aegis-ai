import { describe, it, expect } from "vitest";
import {
  UniversalRequirementInterpreter,
} from "../universal-requirement-interpreter.js";

describe("UniversalRequirementInterpreter — Arbitrary Domain Understanding", () => {
  it("interprets an aerospace drone telemetry dashboard correctly", () => {
    const prompt = "Build an autonomous drone fleet telemetry platform with flight path tracking and battery alerts";
    const spec = UniversalRequirementInterpreter.interpret(prompt);

    expect(spec.domainCategory).toBe("aerospace-telemetry");
    expect(spec.domainVocabulary.entityName).toBe("Drone");
    expect(spec.domainVocabulary.primaryMetrics).toContain("Active Drones");
    expect(spec.domainVocabulary.actionVerbs).toContain("Deploy");

    // Personas
    const roles = spec.personas.map(p => p.role);
    expect(roles).toContain("MISSION_OPERATOR");
    expect(roles).toContain("SYSTEM_ENGINEER");

    // Features
    expect(spec.features.length).toBeGreaterThanOrEqual(4);
    expect(spec.features.some(f => f.category === "CORE_DOMAIN")).toBe(true);

    // Journeys
    expect(spec.journeys.length).toBeGreaterThanOrEqual(2);
  });

  it("interprets a veterinary clinic management system with appointments and patient records", () => {
    const prompt = "Create a veterinary clinic web app for scheduling pet checkups, recording diagnoses, and managing patient medical history";
    const spec = UniversalRequirementInterpreter.interpret(prompt);

    expect(spec.domainCategory).toBe("veterinary-clinic");
    expect(spec.domainVocabulary.entityName).toBe("Patient");

    const entityNames = spec.entities.map(e => e.name);
    expect(entityNames).toContain("User");
    expect(entityNames).toContain("Patient");
    expect(entityNames).toContain("Appointment");

    // Check relationship
    const patientEntity = spec.entities.find(e => e.name === "Patient")!;
    expect(patientEntity.relations.some(r => r.targetEntity === "Appointment")).toBe(true);

    // Check roles
    const roles = spec.personas.map(p => p.role);
    expect(roles).toContain("VET_DOCTOR");
    expect(roles).toContain("PET_OWNER");
  });

  it("interprets an art gallery auction platform with live bidding", () => {
    const prompt = "Develop an art gallery auction platform with live bidding, artwork catalog, and curator management";
    const spec = UniversalRequirementInterpreter.interpret(prompt);

    expect(spec.domainCategory).toBe("art-gallery-auction");
    expect(spec.domainVocabulary.entityName).toBe("Artwork");

    const entityNames = spec.entities.map(e => e.name);
    expect(entityNames).toContain("Artwork");
    expect(entityNames).toContain("Bid");

    const bidEntity = spec.entities.find(e => e.name === "Bid")!;
    const artworkIdField = bidEntity.fields.find(f => f.name === "artworkId");
    expect(artworkIdField?.isForeignKey).toBe(true);
  });

  it("faithfully captures explicit user technical stack choices", () => {
    const prompt = "Build an equipment rental app using Next.js, Fastify backend, and PostgreSQL database";
    const spec = UniversalRequirementInterpreter.interpret(prompt);

    expect(spec.technicalConstraints.frontendFramework).toBe("nextjs");
    expect(spec.technicalConstraints.backendFramework).toBe("fastify");
    expect(spec.technicalConstraints.databaseEngine).toBe("postgresql");
    expect(spec.technicalConstraints.userSpecified.frontend).toBe(true);
    expect(spec.technicalConstraints.userSpecified.backend).toBe(true);
    expect(spec.technicalConstraints.userSpecified.database).toBe(true);
  });

  it("converts to legacy ProjectSpecification cleanly", () => {
    const prompt = "Build a peer-to-peer equipment rental service with payment checkout";
    const spec = UniversalRequirementInterpreter.interpret(prompt);
    const legacy = UniversalRequirementInterpreter.toProjectSpecification(spec);

    expect(legacy.name).toBeDefined();
    expect(legacy.type).toBe("fullstack");
    expect(legacy.features?.length).toBeGreaterThan(0);
    expect(legacy.domainVocabulary?.entityName).toBe("Equipment");
  });
});
