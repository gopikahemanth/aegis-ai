import { describe, it, expect } from "vitest";
import { FrontendExperienceVerifier } from "../frontend-experience-verifier.js";
import { InteractiveComponentGenerator } from "../interactive-component-generator.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";

describe("Phase 4: FrontendExperienceVerifier", () => {
  it("passes when generated components satisfy the NIR threshold (>= 0.95) and full route coverage", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Build a project management board with task list, task modal, and team metrics"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const generated = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary);

    const report = FrontendExperienceVerifier.audit(
      generated.map(g => ({ path: g.path, content: g.content })),
      contract
    );

    expect(report.nirScore).toBeGreaterThanOrEqual(0.95);
    expect(report.passed).toBe(true);
    expect(report.inertElementsCount).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it("flags inert buttons and fails audit when dummy or empty handlers are present", () => {
    const inertFiles = [
      {
        path: "src/pages/BadPage.tsx",
        content: `
          import React from 'react';
          export const BadPage = () => {
            return (
              <div>
                <h1>Inert Dashboard</h1>
                <button onClick={() => {}}>Do Nothing</button>
                <button>Dead Button Without Handler</button>
                <input placeholder="Uncontrolled unhandled input" />
              </div>
            );
          };
        `,
      },
    ];

    const report = FrontendExperienceVerifier.audit(inertFiles);

    expect(report.nirScore).toBeLessThan(0.95);
    expect(report.passed).toBe(false);
    expect(report.findings.length).toBeGreaterThanOrEqual(2);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("detects missing frontend routes declared in architecture contract", () => {
    const validComponent = [
      {
        path: "src/App.tsx",
        content: `
          import React from 'react';
          import { BrowserRouter, Routes, Route } from 'react-router-dom';
          export const App = () => (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<div />} />
              </Routes>
            </BrowserRouter>
          );
        `,
      },
    ];

    const dummyContract: any = {
      routes: {
        frontendRoutes: ["/", "/products", "/checkout", "/admin"],
      },
    };

    const report = FrontendExperienceVerifier.audit(validComponent, dummyContract);

    expect(report.routeCoverage.missingRoutes).toContain("/products");
    expect(report.routeCoverage.missingRoutes).toContain("/checkout");
    expect(report.routeCoverage.missingRoutes).toContain("/admin");
    expect(report.passed).toBe(false);
  });
});
