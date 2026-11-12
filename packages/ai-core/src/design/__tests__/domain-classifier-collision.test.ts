import { describe, it, expect } from "vitest";
import { ProductUnderstanding } from "../product-understanding.js";
import { DomainVisualDesignContractDeriver } from "../domain-visual-contract.js";

describe("Domain Classifier Collision Regression Suite (Defect 1)", () => {
  it("classifies 'Coffee roastery with cart quantity updates' dynamically and NOT automotive", () => {
    const prompt = "Create a modern artisanal coffee roastery and cafe website for 'Aura Roasters' featuring menu categorization, bean roast and grind customizations, cart quantity updates with live total calculation, online table reservations with date and guest validation, and contact inquiry feedback.";
    const analysis = ProductUnderstanding.analyze(prompt);
    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    expect(analysis.primaryActivity).toBe("booking-ordering");
    expect(analysis.avoidancePatterns).not.toContain("cart");
    expect(contract.domain.toLowerCase()).not.toContain("automotive");
    expect(contract.domain.toLowerCase()).not.toContain("detailing");
    expect(contract.productType.toLowerCase()).not.toContain("detailing");
  });

  it("classifies 'Cafe website with a shopping cart' dynamically and NOT automotive", () => {
    const prompt = "A trendy boutique cafe website with a shopping cart for pastries, cold brew bottles, and merchandise.";
    const analysis = ProductUnderstanding.analyze(prompt);
    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    expect(analysis.primaryActivity).toBe("booking-ordering");
    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toMatch(/ceramic\s*shield|engine\s*bay|touchless\s*wash|detailing\s*bay/i);
  });

  it("derives dynamic contract for automotive detailing without bookstore contamination", () => {
    const prompt = "Modern auto detailing studio featuring ceramic coating packages, paint correction, interior steam cleaning, and online bay reservation.";
    const analysis = ProductUnderstanding.analyze(prompt);
    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toContain("yirgacheffe");
    expect(json).not.toContain("overstory");
  });

  it("derives dynamic contract for car wash without bookstore contamination", () => {
    const prompt = "Express car wash booking website with subscription wash passes, touchless bay scheduler, and fleet wash discounts.";
    const analysis = ProductUnderstanding.analyze(prompt);
    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toContain("yirgacheffe");
    expect(json).not.toContain("overstory");
  });

  it("falls back cleanly for an unfamiliar domain without imposing automotive or bookstore copy", () => {
    const prompt = "Bespoke vintage horology atelier restoring antique mechanical wristwatches and pocket chronometers.";
    const analysis = ProductUnderstanding.analyze(prompt);
    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toMatch(/ceramic\s*shield|engine\s*bay|touchless\s*wash|detailing\s*bay/i);
    expect(json).not.toMatch(/the overstory|braiding sweetgrass/i);
  });
});
