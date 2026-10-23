import { describe, it, expect } from "vitest";
import { StorefrontCatalogExperienceGenerator } from "../experience-generators/storefront-catalog-generator.js";

describe("Domain Classifier Collision Regression Suite (Defect 1)", () => {
  it("classifies 'Coffee roastery with cart quantity updates' as coffee/hospitality and NOT automotive", () => {
    const prompt = "Create a modern artisanal coffee roastery and cafe website for 'Aura Roasters' featuring menu categorization, bean roast and grind customizations, cart quantity updates with live total calculation, online table reservations with date and guest validation, and contact inquiry feedback.";
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(prompt, "Aura Roasters");

    // Must NOT be automotive
    expect(catalog.domainCategory).not.toBe("automotive");
    expect(catalog.domainLabel).not.toContain("Detailing");
    expect(catalog.badge).not.toContain("Ceramic");
    expect(catalog.heroTitle).not.toContain("Detailing");

    // Must be coffee / roastery
    expect(catalog.domainCategory).toMatch(/coffee|cafe|roaster|hospitality/i);
    expect(catalog.products.length).toBeGreaterThan(0);

    // Verify rendered content contains coffee terms and ZERO automotive terms
    const productTitles = catalog.products.map(p => p.title).join(" ");
    expect(productTitles).not.toMatch(/ceramic|engine bay|foam exterior|touchless wash|steam sanitization/i);
    expect(productTitles).toMatch(/roast|coffee|origin|blend|bean|brew|espresso/i);
  });

  it("classifies 'Cafe website with a shopping cart' as coffee/cafe/hospitality and NOT automotive", () => {
    const prompt = "A trendy boutique cafe website with a shopping cart for pastries, cold brew bottles, and merchandise.";
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(prompt, "Velvet Cafe");

    expect(catalog.domainCategory).not.toBe("automotive");
    expect(catalog.domainCategory).toMatch(/coffee|cafe|bakery|hospitality/i);

    const content = JSON.stringify(catalog);
    expect(content).not.toMatch(/ceramic\s*shield|engine\s*bay|touchless\s*wash|detailing\s*bay/i);
  });

  it("preserves correct automotive classification for 'Automotive detailing and ceramic coating packages'", () => {
    const prompt = "Modern auto detailing studio featuring ceramic coating packages, paint correction, interior steam cleaning, and online bay reservation.";
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(prompt, "Apex Detailing");

    expect(catalog.domainCategory).toBe("automotive");
    expect(catalog.domainLabel).toContain("Detailing");
    expect(catalog.products.some(p => /ceramic|detail/i.test(p.title))).toBe(true);
  });

  it("preserves correct automotive classification for 'Car wash booking website'", () => {
    const prompt = "Express car wash booking website with subscription wash passes, touchless bay scheduler, and fleet wash discounts.";
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(prompt, "HydroWash");

    expect(catalog.domainCategory).toBe("automotive");
    expect(catalog.domainLabel).toContain("Detailing");
  });

  it("falls back cleanly for an unfamiliar domain without imposing automotive or bookstore copy", () => {
    const prompt = "Bespoke vintage horology atelier restoring antique mechanical wristwatches and pocket chronometers.";
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(prompt, "Chronos Atelier");

    expect(catalog.domainCategory).toBe("general");
    const content = JSON.stringify(catalog);
    expect(content).not.toMatch(/ceramic\s*shield|engine\s*bay|touchless\s*wash|detailing\s*bay/i);
    expect(content).not.toMatch(/the overstory|braiding sweetgrass/i);
  });
});
