import { describe, it, expect } from "vitest";
import { ArchitectureResolver } from "../architecture-resolver.js";

describe("Phase 4 — Architecture and Technology Stack Selection", () => {
  it("1. Respects explicit user request for React and Express / Node", () => {
    const prompt = "Build a project management platform using React and Express with PostgreSQL";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.frontend.framework).toBe("React-Vite");
    expect(contract.frontend.provenance).toBe("user");
    expect(contract.backend.framework).toBe("Express");
    expect(contract.backend.provenance).toBe("user");
    expect(contract.database.provider).toBe("PostgreSQL");
    expect(contract.database.provenance).toBe("user");
  });

  it("2. Respects user requesting alternative frameworks (Vue and FastAPI)", () => {
    const prompt = "Create a data dashboard using Vue and FastAPI with SQLite";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.frontend.framework).toBe("Vue-Vite");
    expect(contract.frontend.provenance).toBe("user");
    expect(contract.backend.framework).toBe("FastAPI");
    expect(contract.backend.provenance).toBe("user");
    expect(contract.database.provider).toBe("SQLite");
    expect(contract.database.provenance).toBe("user");
  });

  it("3. Resolves static landing site with zero backend and zero database", () => {
    const prompt = "Create a simple static landing page for a local coffee shop without database";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.applicationType).toBe("STATIC_SITE");
    expect(contract.frontend.framework).toBe("HTML5/Vanilla");
    expect(contract.backend.framework).toBe("None");
    expect(contract.database.provider).toBe("None");
    expect(contract.database.orm).toBe("None");
  });

  it("4. Includes authentication and database persistence when required by workflows", () => {
    const prompt = "Build a SaaS subscription platform for medical patient records with secure login, role-based access, and account settings";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.applicationType).toBe("SAAS_APPLICATION");
    expect(contract.database.provider).not.toBe("None");
    expect(contract.authentication).toBe("JWT");
    expect(contract.requiredModels.length).toBeGreaterThanOrEqual(1);
  });

  it("5. Detects real-time requirements for telemetry or chat applications", () => {
    const prompt = "Build an avionics telemetry console with live streaming sensor feeds and real-time alerts";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.backend.framework).toBe("Express");
    expect(contract.database.provider).toBe("PostgreSQL");
  });

  it("6. Selects sensible full-stack defaults with transparent provenance when user specifies no technology", () => {
    const prompt = "Create an online boutique store for vintage luxury watches";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.frontend.framework).toBe("React-Vite");
    expect(contract.frontend.provenance).toBe("default");
    expect(contract.backend.framework).toBe("Express");
    expect(contract.backend.provenance).toBe("default");
    expect(contract.database.provider).toBe("PostgreSQL");
    expect(contract.database.provenance).toBe("default");
    expect(contract.status).toBe("locked");
    expect(contract.architectureProfile).toBeDefined();
  });

  it("7. Resolves single-page photographer portfolio to CLIENT_SIDE_APPLICATION without backend or database", () => {
    const prompt = "Build a simple single-page portfolio for a photographer named Elena Vance";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.applicationType).toBe("CLIENT_SIDE_APPLICATION");
    expect(contract.frontend.framework).toBe("React-Vite");
    expect(contract.backend.framework).toBe("None");
    expect(contract.database.provider).toBe("None");
    expect(contract.database.orm).toBe("None");
    expect(contract.authentication).toBe("None");
    expect(contract.architectureProfile).toBe("CLIENT_SIDE_REACT_VITE");
  });

  it("8. Resolves booking platform to FULLSTACK_WEB_APPLICATION with database", () => {
    const prompt = "Build an appointment booking platform for a veterinary clinic to manage bookings and customer records";
    const contract = ArchitectureResolver.resolve(prompt);

    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.backend.framework).toBe("Express");
    expect(contract.database.provider).not.toBe("None");
  });
});
