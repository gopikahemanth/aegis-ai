import { describe, it, expect } from "vitest";
import { InteractiveComponentGenerator } from "../interactive-component-generator.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";

describe("Phase 4: InteractiveComponentGenerator", () => {
  it("should generate a complete, interactive component suite for an e-commerce domain", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Build a modern online electronics store with product catalog, cart, checkout, and admin analytics"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const vocab = spec.domainVocabulary;

    const files = InteractiveComponentGenerator.generateAll(contract, vocab);

    expect(files.length).toBeGreaterThanOrEqual(7);

    const paths = files.map(f => f.path);
    expect(paths).toContain("src/components/Navbar.tsx");
    expect(paths).toContain("src/App.tsx");
    expect(paths.some(p => p.includes("ListPage.tsx"))).toBe(true);
    expect(paths.some(p => p.includes("DetailModal.tsx"))).toBe(true);
    expect(paths.some(p => p.includes("FormModal.tsx"))).toBe(true);
    expect(paths).toContain("src/components/MetricDashboard.tsx");
    expect(paths).toContain("src/index.css");

    // Verify all generated files have valid content
    for (const file of files) {
      expect(file.content.length).toBeGreaterThan(50);
    }
  });

  it("enforces zero inert buttons and requires active event handlers", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Create a fitness tracking app where users log workouts and track calories"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const files = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary);

    // Verify no inert placeholder handlers exist in any generated tsx files
    for (const file of files) {
      if (file.path.endsWith(".tsx")) {
        expect(file.content).not.toContain("onClick={() => {}}");
        expect(file.content).not.toContain("onClick={() => void 0}");
        expect(file.content).not.toContain("onSubmit={() => {}}");
      }
    }

    // Verify entity form modal has controlled inputs and form submission
    const formModal = files.find(f => f.path.includes("FormModal.tsx"));
    expect(formModal).toBeDefined();
    expect(formModal?.content).toContain("onSubmit={handleSubmit}");
    expect(formModal?.content).toContain("onChange=");
    expect(formModal?.content).toContain("useState");

    // Verify entity list page has search filtering and sort toggles
    const listPage = files.find(f => f.path.includes("ListPage.tsx"));
    expect(listPage).toBeDefined();
    expect(listPage?.content).toContain("searchQuery");
    expect(listPage?.content).toContain("sortBy");
    expect(listPage?.content).toContain("onClick=");
  });

  it("adapts component naming and entity domain across diverse domains", () => {
    const legalSpec = UniversalRequirementInterpreter.interpret(
      "Design a legal practice management portal for tracking client cases and legal documents"
    );
    const legalContract = ArchitectureContractEngine.synthesizeContract(legalSpec);
    const legalFiles = InteractiveComponentGenerator.generateAll(legalContract, legalSpec.domainVocabulary);

    const navbar = legalFiles.find(f => f.path.includes("Navbar.tsx"));
    expect(navbar?.content).toContain(legalSpec.domainVocabulary.entityPlural);
  });
});
