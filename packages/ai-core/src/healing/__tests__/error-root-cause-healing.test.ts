import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TsSymbolRepairEngine } from "../ts-symbol-repair-engine.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { TokenBudgetManager } from "../../context/token-budget.js";
import { StorefrontCatalogExperienceGenerator } from "../../design/experience-generators/storefront-catalog-generator.js";

describe("Aegis Core Error-Free Reliability Suite", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-error-free-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("1. TsSymbolRepairEngine repairs TS2345 accidental identity lambda in action handlers", () => {
    const filePath = join(testDir, "src", "pages", "StorefrontHome.tsx");
    const code = `import React from 'react';
export const StorefrontHome = () => {
  const cart = [{ id: 'item-101', name: 'Leash' }];
  const updateQty = (id: string, delta: number) => {};
  return (
    <div>
      {cart.map((item) => (
        <button key={item.id} onClick={() => updateQty(id => id, -1)}>-</button>
      ))}
    </div>
  );
};
`;
    writeFileSync(filePath, code, "utf8");

    const diagnostic = `src/pages/StorefrontHome.tsx(8,56): error TS2345: Argument of type '(id: any) => any' is not assignable to parameter of type 'string'.`;
    const actions = TsSymbolRepairEngine.repair(testDir, diagnostic);

    expect(actions.length).toBeGreaterThan(0);
    const updatedCode = readFileSync(filePath, "utf8");
    expect(updatedCode).not.toContain("updateQty(id => id, -1)");
    expect(updatedCode).toContain("item");
    expect(updatedCode).toContain(".id");
  });

  it("2. TsSymbolRepairEngine repairs TS2322 union cast mismatch", () => {
    const filePath = join(testDir, "src", "pages", "FormPage.tsx");
    const code = `import React, { useState } from 'react';
export const FormPage = () => {
  const [severity, setSeverity] = useState<'Mild'>('Mild');
  return <button onClick={() => setSeverity('Moderate' as 'Mild' | 'Moderate' | 'Severe')}>Set</button>;
};
`;
    writeFileSync(filePath, code, "utf8");

    const diagnostic = `src/pages/FormPage.tsx(4,48): error TS2322: Type '"Mild" | "Moderate" | "Severe"' is not assignable to type '"Mild"'.`;
    const actions = TsSymbolRepairEngine.repair(testDir, diagnostic);

    expect(actions.length).toBeGreaterThan(0);
    const updatedCode = readFileSync(filePath, "utf8");
    expect(updatedCode).toContain("as any");
  });

  it("3. FastSanitizer preflights and repairs accidental identity callbacks in JSX", () => {
    const filePath = join(testDir, "src", "pages", "CartView.tsx");
    const code = `import React from 'react';
export const CartView = () => {
  return <button onClick={() => updateQty(id => id, 1)}>+</button>;
};
`;
    writeFileSync(filePath, code, "utf8");

    FastDeterministicSanitizer.sanitizeProject(testDir);
    const updated = readFileSync(filePath, "utf8");
    expect(updated).not.toContain("updateQty(id => id, 1)");
    expect(updated).toContain("typeof item !== 'undefined'");
  });

  it("4. FastSanitizer cleans blocklisted template phrases for non-matching domains", () => {
    const brief = {
      prompt: "A luxury pet boutique and veterinary spa for dogs and cats",
      brandName: "Paws & Velvet",
      vocabularyContract: { forbidden: [] },
    };
    writeFileSync(join(testDir, ".aegis", "design-brief.json"), JSON.stringify(brief), "utf8");

    const compFile = join(testDir, "src", "pages", "StorefrontHome.tsx");
    const code = `import React from 'react';
export const StorefrontHome = () => {
  return (
    <div>
      <span>Pickup Slot: Morning Batch</span>
      <p>Located in Kyoto, Japan</p>
    </div>
  );
};
`;
    writeFileSync(compFile, code, "utf8");

    FastDeterministicSanitizer.ensureDesignIntentCompliance(testDir);
    const updated = readFileSync(compFile, "utf8");
    expect(updated).not.toContain("Morning Batch");
    expect(updated).toContain("Morning Reserve");
    expect(updated).not.toContain("Kyoto, Japan");
    expect(updated).toContain("Metropolitan Studio");
  });

  it("5. TokenBudgetManager grants generous context headroom and output tokens to Gemini models", () => {
    const flashProfile = TokenBudgetManager.getProfile("gemini-3.7-flash");
    expect(flashProfile.maxPromptTokens).toBeGreaterThanOrEqual(250000);
    expect(flashProfile.maxCompletionTokens).toBeGreaterThanOrEqual(32768);

    const budget = TokenBudgetManager.calculatePerRequestBudget(
      "gemini-3.7-flash",
      35000, // Large 35k prompt
      16384, // Requested 16k tokens
      100000 // Remaining cumulative tokens
    );
    // Must NOT clamp down to tiny 800-char limits!
    expect(budget.effectiveMaxTokens).toBe(16384);
  });

  it("6. StorefrontCatalogExperienceGenerator derives domain-pure pet boutique catalog", () => {
    const catalog = StorefrontCatalogExperienceGenerator.deriveDomainCatalog(
      "Create an artisanal pet boutique with handcrafted leather collars and organic treats",
      "Noble Hound"
    );

    expect(catalog.domainCategory).toBe("artisanal-pet-boutique");
    expect(catalog.itemNoun).toBe("Pet Essential");
    expect(catalog.products.some(p => p.title.toLowerCase().includes("collar"))).toBe(true);
    expect(catalog.products.some(p => p.title.toLowerCase().includes("salmon"))).toBe(true);
    // Zero template phrase leaks in highlights
    expect(catalog.products.every(p => p.highlightTag !== "Morning Batch")).toBe(true);
  });

  it("7. FastSanitizer neutralizes empty onClick handlers and fake export alerts", () => {
    const compFile = join(testDir, "src", "pages", "HealthPassport.tsx");
    const code = `import React from 'react';
export const HealthPassport = () => {
  return (
    <div>
      <button onClick={() => {}}>Empty Action</button>
      <button onClick={() => alert('Exporting passport PDF...')}>Download PDF</button>
    </div>
  );
};
`;
    writeFileSync(compFile, code, "utf8");

    FastDeterministicSanitizer.sanitizeProject(testDir);
    const updated = readFileSync(compFile, "utf8");
    // Empty handler sanitized to real interaction
    expect(updated).not.toContain("onClick={() => {}}");
    expect(updated).toContain("setAttribute");
    // Fake export alert converted to real window.print()
    expect(updated).not.toContain("alert('Exporting");
    expect(updated).toContain("window.print()");
  });
  it("8. TsSymbolRepairEngine repairs TS2440 import collision with redundant local declaration", () => {
    const filePath = join(testDir, "src", "pages", "FinancialReportingSuite.tsx");
    const code = `import React, { useState } from 'react';
import { Button, GlassCard } from '../design-system';

const Button = (props: any) => <button className="px-3 py-1.5" {...props}>{props.children}</button>;

export const FinancialReportingSuite = () => {
  return <div><Button>Export</Button></div>;
};
`;
    writeFileSync(filePath, code, "utf8");

    const diagnostic = `src/pages/FinancialReportingSuite.tsx(2,10): error TS2440: Import declaration conflicts with local declaration of 'Button'.`;
    const actions = TsSymbolRepairEngine.repair(testDir, diagnostic);

    expect(actions.length).toBeGreaterThan(0);
    const updatedCode = readFileSync(filePath, "utf8");
    // Redundant local declaration is removed so canonical design-system Button is used
    expect(updatedCode).not.toContain('const Button = (props: any)');
    expect(updatedCode).toContain("import { Button, GlassCard } from '../design-system'");
    expect(updatedCode).toContain('<Button>Export</Button>');
  });
});
