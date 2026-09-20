import { describe, it, expect } from "vitest";
import { FunctionalPresenceGate } from "../functional-presence-gate.js";
import type { BrowserDOMSnapshot } from "../visual-quality-gate.js";
import { CompositionGraphSynthesizer } from "../../design/composition-graph.js";

describe("FunctionalPresenceGate — Live Functional Capability & Presence Certification", () => {
  const synthesis = CompositionGraphSynthesizer.synthesize(
    "Kerala Handicraft Atelier selling handmade brass lamps, traditional textiles, woodcraft and contemporary home decor"
  );
  const graph = synthesis.graph;

  const validRichSnapshot: BrowserDOMSnapshot = {
    viewport: { width: 1440, height: 900 },
    scrollWidth: 1440,
    clientWidth: 1440,
    bodyBackground: "rgb(15, 23, 42)",
    bodyColor: "rgb(248, 250, 252)",
    rawText:
      "Kerala Heritage Craft Atelier Handcrafted Brass Aranmula Mirror Nettipattam Elephant Caparison Nilavilakku Traditional Bell Metal Lamp Teakwood Kathakali Mask Kasavu Gold Zari Saree Handwoven Balaramapuram Cotton Throw Rosewood Spice Chest Add to Cart Explore Artisan Story Compare Craft Techniques Filter by Brass Woodcraft Textiles Inquire Bespoke Commission Master Craftsman Sankaran Kutty 42 years experience Geographical Indication GI Tagged Authentic Certificate",
    elements: [
      {
        tagName: "HEADER",
        className: "border-b border-amber-900/40 px-6 py-4 flex items-center justify-between",
        boundingRect: { x: 0, y: 0, width: 1440, height: 72 },
        computedStyles: {
          fontSize: "16px",
          lineHeight: "24px",
          color: "rgb(248, 250, 252)",
          backgroundColor: "rgb(15, 23, 42)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "16px", paddingRight: "24px", paddingBottom: "16px", paddingLeft: "24px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "NAV",
        className: "flex gap-6 items-center",
        boundingRect: { x: 600, y: 20, width: 400, height: 32 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(248, 250, 252)",
          backgroundColor: "transparent",
          fontFamily: "Inter, sans-serif",
          paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "A",
        className: "nav-link text-amber-300 font-medium hover:text-amber-200",
        boundingRect: { x: 600, y: 20, width: 80, height: 32 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(252, 211, 77)",
          backgroundColor: "transparent",
          fontFamily: "Inter, sans-serif",
          paddingTop: "6px", paddingRight: "12px", paddingBottom: "6px", paddingLeft: "12px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "pointer",
        },
      },
      {
        tagName: "A",
        className: "nav-link text-stone-300 hover:text-white",
        boundingRect: { x: 700, y: 20, width: 90, height: 32 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(214, 211, 209)",
          backgroundColor: "transparent",
          fontFamily: "Inter, sans-serif",
          paddingTop: "6px", paddingRight: "12px", paddingBottom: "6px", paddingLeft: "12px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "pointer",
        },
      },
      {
        tagName: "H1",
        className: "text-4xl font-serif font-bold text-amber-100",
        boundingRect: { x: 48, y: 120, width: 800, height: 48 },
        computedStyles: {
          fontSize: "36px",
          lineHeight: "44px",
          color: "rgb(254, 243, 199)",
          backgroundColor: "transparent",
          fontFamily: "Playfair Display, serif",
          paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
          marginTop: "0px", marginRight: "0px", marginBottom: "16px", marginLeft: "0px",
          cursor: "default",
        },
      },
      // Craft Product Cards
      {
        tagName: "DIV",
        className: "product-card bg-slate-900/80 border border-amber-900/30 rounded-xl p-5",
        boundingRect: { x: 48, y: 240, width: 320, height: 380 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(248, 250, 252)",
          backgroundColor: "rgb(15, 23, 42)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "DIV",
        className: "product-card bg-slate-900/80 border border-amber-900/30 rounded-xl p-5",
        boundingRect: { x: 388, y: 240, width: 320, height: 380 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(248, 250, 252)",
          backgroundColor: "rgb(15, 23, 42)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "DIV",
        className: "product-card bg-slate-900/80 border border-amber-900/30 rounded-xl p-5",
        boundingRect: { x: 728, y: 240, width: 320, height: 380 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(248, 250, 252)",
          backgroundColor: "rgb(15, 23, 42)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "default",
        },
      },
      // Interactive Buttons & Controls
      {
        tagName: "BUTTON",
        className: "btn btn-primary bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium",
        boundingRect: { x: 48, y: 560, width: 140, height: 40 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(255, 255, 255)",
          backgroundColor: "rgb(217, 119, 6)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "8px", paddingRight: "16px", paddingBottom: "8px", paddingLeft: "16px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "pointer",
        },
      },
      {
        tagName: "BUTTON",
        className: "btn btn-secondary bg-slate-800 text-amber-200 px-4 py-2 rounded-lg font-medium",
        boundingRect: { x: 200, y: 560, width: 140, height: 40 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(254, 243, 199)",
          backgroundColor: "rgb(30, 41, 59)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "8px", paddingRight: "16px", paddingBottom: "8px", paddingLeft: "16px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "pointer",
        },
      },
      {
        tagName: "INPUT",
        className: "search-input bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-white",
        boundingRect: { x: 48, y: 190, width: 280, height: 38 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(255, 255, 255)",
          backgroundColor: "rgb(15, 23, 42)",
          fontFamily: "Inter, sans-serif",
          paddingTop: "8px", paddingRight: "16px", paddingBottom: "8px", paddingLeft: "16px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "text",
        },
      },
    ],
  };

  it("1. REJECTS blank shell after successful React mount (Adversarial Test 1)", () => {
    const blankShellSnapshot: BrowserDOMSnapshot = {
      viewport: { width: 1440, height: 900 },
      scrollWidth: 1440,
      clientWidth: 1440,
      bodyBackground: "rgb(15, 23, 42)",
      bodyColor: "rgb(248, 250, 252)",
      rawText: "Kerala Craft Atelier Heritage Handicrafts & Art",
      elements: [
        {
          tagName: "H1",
          className: "text-2xl font-bold",
          boundingRect: { x: 20, y: 20, width: 300, height: 32 },
          computedStyles: {
            fontSize: "24px",
            lineHeight: "32px",
            color: "#fff",
            backgroundColor: "transparent",
            fontFamily: "Inter, sans-serif",
            paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
            marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
            cursor: "default",
          },
        },
      ],
    };

    const result = FunctionalPresenceGate.evaluate(blankShellSnapshot, {
      compositionGraph: graph,
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.score).toBeLessThan(50);
    expect(result.failureReasons.some(r => r.includes("Primary workspace") || r.includes("content depth"))).toBe(true);
  });

  it("2. REJECTS API failure causing empty product UI (Adversarial Test 2)", () => {
    const apiCrashSnapshot: BrowserDOMSnapshot = {
      ...validRichSnapshot,
      rawText: "Failed to fetch /api/products: Internal Server Error 500",
    };

    const result = FunctionalPresenceGate.evaluate(apiCrashSnapshot, {
      compositionGraph: graph,
      networkFailures: [{ url: "/api/products", status: 500, error: "Internal Server Error" }],
      consoleErrors: ["Error: Failed to fetch products 500"],
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.checks.find(c => c.id === "check_data_integrity")?.passed).toBe(false);
  });

  it("3. REJECTS missing primary workspace region (Adversarial Test 3)", () => {
    const noWorkspaceSnapshot: BrowserDOMSnapshot = {
      ...validRichSnapshot,
      // Filter out all cards and items
      elements: validRichSnapshot.elements.filter(
        el => !el.className.includes("product-card") && !el.className.includes("card")
      ),
    };

    const result = FunctionalPresenceGate.evaluate(noWorkspaceSnapshot, {
      compositionGraph: graph,
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.missingCapabilities).toContain("Primary Workspace (catalog_grid)");
  });

  it("4. REJECTS passive/dead UI with zero interactive controls (Adversarial Test 4)", () => {
    const passiveSnapshot: BrowserDOMSnapshot = {
      ...validRichSnapshot,
      // Strip all buttons, inputs, links
      elements: validRichSnapshot.elements.filter(
        el => el.tagName !== "BUTTON" && el.tagName !== "INPUT" && el.tagName !== "A" && el.tagName !== "SELECT"
      ),
    };

    const result = FunctionalPresenceGate.evaluate(passiveSnapshot, {
      compositionGraph: graph,
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.checks.find(c => c.id === "check_interactive_actions")?.passed).toBe(false);
  });

  it("5. REJECTS UI with missing navigation architecture and route headers (Adversarial Test 5)", () => {
    const noNavSnapshot: BrowserDOMSnapshot = {
      ...validRichSnapshot,
      // Strip header and nav
      elements: validRichSnapshot.elements.filter(
        el => el.tagName !== "HEADER" && el.tagName !== "NAV" && el.tagName !== "A"
      ),
    };

    const result = FunctionalPresenceGate.evaluate(noNavSnapshot, {
      compositionGraph: graph,
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.checks.find(c => c.id === "check_navigation_architecture")?.passed).toBe(false);
  });

  it("6. REJECTS application with unhandled browser console exceptions", () => {
    const result = FunctionalPresenceGate.evaluate(validRichSnapshot, {
      compositionGraph: graph,
      consoleErrors: ["Uncaught TypeError: Cannot read properties of undefined (reading 'map')"],
    });

    expect(result.passed).toBe(false);
    expect(result.isMasterCertified).toBe(false);
    expect(result.failureReasons.some(r => r.includes("Runtime or data-flow failure"))).toBe(true);
  });

  it("7. MASTER CERTIFIES legitimate, rich multi-capability Kerala Craft Atelier application", () => {
    const result = FunctionalPresenceGate.evaluate(validRichSnapshot, {
      compositionGraph: graph,
      multiViewportSnapshots: {
        desktop: validRichSnapshot,
        tablet: { ...validRichSnapshot, viewport: { width: 768, height: 1024 } },
        mobile: { ...validRichSnapshot, viewport: { width: 375, height: 812 } },
      },
    });

    expect(result.passed).toBe(true);
    expect(result.isMasterCertified).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.detectedCapabilities).toContain("Primary Workspace (catalog_grid)");
    expect(result.detectedCapabilities).toContain("Domain Content Depth");
    expect(result.detectedCapabilities).toContain("Interactive User Actions");
    expect(result.detectedCapabilities).toContain("Header Navigation");
    expect(result.failureReasons.length).toBe(0);
  });
});
