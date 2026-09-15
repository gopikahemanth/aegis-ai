import { describe, it, expect } from "vitest";
import { VisualQualityGate, type BrowserDOMSnapshot } from "../visual-quality-gate.js";
import { CompositionGraphSynthesizer } from "../../design/composition-graph.js";

describe("VisualQualityGate — Automated Visual Quality & Defect Rejection Certification", () => {
  const validSnapshot: BrowserDOMSnapshot = {
    viewport: { width: 1440, height: 900 },
    scrollWidth: 1440,
    clientWidth: 1440,
    bodyBackground: "rgb(14, 12, 10)",
    bodyColor: "rgb(250, 250, 249)",
    rawText: "Suite Availability & Pricing Matrix Luxury Penthouse Suite $1,850",
    elements: [
      {
        tagName: "H1",
        className: "text-3xl font-bold tracking-tight",
        boundingRect: { x: 32, y: 32, width: 800, height: 36 },
        computedStyles: {
          fontSize: "30px",
          lineHeight: "36px",
          color: "rgb(250, 250, 249)",
          backgroundColor: "transparent",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
          marginTop: "0px", marginRight: "0px", marginBottom: "8px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "H2",
        className: "text-lg font-bold",
        boundingRect: { x: 32, y: 120, width: 600, height: 28 },
        computedStyles: {
          fontSize: "20px",
          lineHeight: "28px",
          color: "rgb(250, 250, 249)",
          backgroundColor: "transparent",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
          marginTop: "16px", marginRight: "0px", marginBottom: "8px", marginLeft: "0px",
          cursor: "default",
        },
      },
      {
        tagName: "BUTTON",
        className: "btn btn-primary px-4 py-2 rounded-lg",
        boundingRect: { x: 32, y: 200, width: 180, height: 40 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(255, 255, 255)",
          backgroundColor: "rgb(217, 119, 6)",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          paddingTop: "8px", paddingRight: "16px", paddingBottom: "8px", paddingLeft: "16px",
          marginTop: "0px", marginRight: "0px", marginBottom: "0px", marginLeft: "0px",
          cursor: "pointer",
        },
      },
      {
        tagName: "P",
        className: "text-sm text-stone-300",
        boundingRect: { x: 32, y: 260, width: 600, height: 24 },
        computedStyles: {
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgb(214, 211, 209)",
          backgroundColor: "transparent",
          fontFamily: "Inter, sans-serif",
          paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
          marginTop: "8px", marginRight: "0px", marginBottom: "16px", marginLeft: "0px",
          cursor: "default",
        },
      }
    ],
  };

  it("Certifies premium valid interfaces with AEGIS_MASTER_CERTIFIED (score >= 90)", () => {
    const graph = CompositionGraphSynthesizer.synthesize("Build a luxury resort platform called GrandAegis Resort with suite availability.");
    const report = VisualQualityGate.evaluate(validSnapshot, undefined, graph);

    expect(report.passed).toBe(true);
    expect(report.isMasterCertified).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.typography.hierarchy).toBe(true);
    expect(report.geometry.hasHorizontalOverflow).toBe(false);
    expect(report.defectsDetected).toHaveLength(0);
  });

  it("REJECTS inverted typographic scale defect (H1 smaller than body)", () => {
    const brokenTypographySnapshot: BrowserDOMSnapshot = {
      ...validSnapshot,
      elements: validSnapshot.elements.map(el => {
        if (el.tagName === "H1") {
          return {
            ...el,
            computedStyles: { ...el.computedStyles, fontSize: "11px" } // Inverted scale defect
          };
        }
        return el;
      }),
    };

    const report = VisualQualityGate.evaluate(brokenTypographySnapshot);
    expect(report.passed).toBe(false);
    expect(report.isMasterCertified).toBe(false);
    expect(report.typography.hierarchy).toBe(false);
    expect(report.defectsDetected.some(d => d.includes("Broken typography scale"))).toBe(true);
  });

  it("REJECTS horizontal layout overflow defect (scrollWidth > clientWidth)", () => {
    const overflowSnapshot: BrowserDOMSnapshot = {
      ...validSnapshot,
      scrollWidth: 1680, // Horizontal overflow defect!
      clientWidth: 1440,
    };

    const report = VisualQualityGate.evaluate(overflowSnapshot);
    expect(report.passed).toBe(false);
    expect(report.isMasterCertified).toBe(false);
    expect(report.geometry.hasHorizontalOverflow).toBe(true);
    expect(report.defectsDetected.some(d => d.includes("Horizontal layout overflow"))).toBe(true);
  });

  it("REJECTS missing interactive affordance defect (buttons with cursor: default)", () => {
    const noAffordanceSnapshot: BrowserDOMSnapshot = {
      ...validSnapshot,
      elements: validSnapshot.elements.map(el => {
        if (el.tagName === "BUTTON") {
          return {
            ...el,
            computedStyles: { ...el.computedStyles, cursor: "default" } // Missing affordance
          };
        }
        return el;
      }),
    };

    const report = VisualQualityGate.evaluate(noAffordanceSnapshot);
    expect(report.passed).toBe(false);
    expect(report.interaction.cursorAffordance).toBe(false);
    expect(report.defectsDetected.some(d => d.includes("Missing interactive affordance"))).toBe(true);
  });

  it("REJECTS composition mismatch defect (required primary workspace missing from DOM)", () => {
    const mismatchSnapshot: BrowserDOMSnapshot = {
      ...validSnapshot,
      rawText: "Generic Unrelated Page Content Without Target Workspace",
    };

    const graph = CompositionGraphSynthesizer.synthesize("Build a luxury resort platform with suite availability matrix.");
    const report = VisualQualityGate.evaluate(mismatchSnapshot, undefined, graph);

    expect(report.passed).toBe(false);
    expect(report.composition.primaryWorkspaceRendered).toBe(false);
    expect(report.defectsDetected.some(d => d.includes("Composition mismatch"))).toBe(true);
  });

  it("REJECTS Adversarial V2: technically valid deterministic layout with excessive component monotony & weak focal hierarchy", () => {
    // Adversarial V2 has valid typography, valid spacing, 0 overflow, valid cursor, valid workspace in DOM
    // BUT has 12 identical cards with zero visual hierarchy or dominant anchor
    const uniformCards = Array.from({ length: 12 }, (_, i) => ({
      tagName: "DIV",
      className: "card monotone-card",
      boundingRect: { x: (i % 4) * 250 + 20, y: Math.floor(i / 4) * 150 + 80, width: 220, height: 120 },
      computedStyles: {
        fontSize: "14px",
        lineHeight: "20px",
        color: "rgb(250, 250, 249)",
        backgroundColor: "rgb(30, 41, 59)",
        fontFamily: "Inter, sans-serif",
        paddingTop: "16px", paddingRight: "16px", paddingBottom: "16px", paddingLeft: "16px",
        marginTop: "0px", marginRight: "0px", marginBottom: "16px", marginLeft: "0px",
        cursor: "default",
      },
    }));

    const adversarialV2Snapshot: BrowserDOMSnapshot = {
      viewport: { width: 1440, height: 900 },
      scrollWidth: 1440,
      clientWidth: 1440,
      bodyBackground: "rgb(14, 12, 10)",
      bodyColor: "rgb(250, 250, 249)",
      rawText: "Suite Availability Matrix Telemetry Grid 12 Identical Cards",
      elements: [
        validSnapshot.elements[0], // Valid H1 (30px)
        validSnapshot.elements[1], // Valid H2 (20px)
        validSnapshot.elements[2], // Valid Button with cursor pointer
        ...uniformCards,
      ],
    };

    const graph = CompositionGraphSynthesizer.synthesize("Build a luxury resort platform called GrandAegis with suite availability matrix.");
    const report = VisualQualityGate.evaluate(adversarialV2Snapshot, undefined, graph);

    expect(report.passed).toBe(false);
    expect(report.isMasterCertified).toBe(false);
    expect(report.focalHierarchy.hasDominantAnchor).toBe(false);
    expect(report.monotony.isMonotonous).toBe(true);
    expect(report.defectsDetected.some(d => d.includes("Weak focal hierarchy"))).toBe(true);
    expect(report.defectsDetected.some(d => d.includes("Excessive visual monotony"))).toBe(true);
  });
});
