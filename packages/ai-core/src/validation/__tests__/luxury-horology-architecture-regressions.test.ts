import { describe, it, expect } from "vitest";
import { WebsiteExperienceIdentityResolver } from "../../design/website-experience-identity.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("Luxury Horology & Artifact Architecture Regression Suite", () => {
  const watchmakerPrompt =
    "Build a luxury independent haute horlogerie watchmaker website for Aethelgard Atelier. Include an interactive 3D WebGL tourbillon timepiece rotator, an exploded movement viewer inspecting hand-finished calibre anglage and balance wheel escapement, a bespoke dial configurator with guilloche patterns and custom caseback engraving, private salon consultation booking for Geneva, Paris, and NY, a tamper-evident serial provenance certificate registry, and a collector vault portfolio tracking timepieces and valuation.";

  const mockCapabilityPlan: any = {
    real3dRequired: true,
    threeJsRequired: true,
    experienceType: "HERO_CANVAS",
    genre: "LUXURY_ARTIFACT_STAGE",
  };

  const mockCharacteristics: any = {
    experiencePattern: "portfolio-showcase",
    isPublicFacing: true,
    targetAudience: "Luxury Collectors & Haute Horlogerie Enthusiasts",
  };

  const mockNavigationDesign: any = {
    brandTreatment: {
      name: "Aethelgard Atelier",
      tagline: "Manufacture Horlogère Indépendante",
    },
    navItems: [
      { label: "Manufacture", path: "/" },
      { label: "Calibre", path: "/inspect-exploded-movement" },
      { label: "Bespoke", path: "/customize-dial-and-engraving" },
      { label: "Salon", path: "/book-private-atelier-consultation" },
      { label: "Provenance", path: "/register-and-verify-provenance-certificate" },
      { label: "Vault", path: "/collector-vault-portfolio" },
    ],
  };

  it("TEST 1: WebsiteExperienceIdentityResolver classifies luxury watchmaker as LUXURY_ARTIFACT_STAGE even with real3dRequired", () => {
    const identity = WebsiteExperienceIdentityResolver.resolve(
      watchmakerPrompt,
      mockCharacteristics,
      mockCapabilityPlan,
      mockNavigationDesign
    );

    expect(identity.genre).toBe("LUXURY_ARTIFACT_STAGE");
    expect(identity.brandIdentity.name).toBe("Aethelgard Atelier");
  });

  it("TEST 2: PageExperiencePlanner derives tailored luxury roles and zero scroll-narrative fallbacks", () => {
    const identity = WebsiteExperienceIdentityResolver.resolve(
      watchmakerPrompt,
      mockCharacteristics,
      mockCapabilityPlan,
      mockNavigationDesign
    );

    const routes = [
      "/",
      "/inspect-exploded-movement",
      "/customize-dial-and-engraving",
      "/book-private-atelier-consultation",
      "/register-and-verify-provenance-certificate",
      "/collector-vault-portfolio",
    ];

    const { pages: plans } = PageExperiencePlanner.plan(
      watchmakerPrompt,
      routes
    );

    expect(plans).toHaveLength(6);

    const homePlan = plans.find((p) => p.route === "/");
    expect(homePlan?.pageRole).toContain("Hero Artifact Stage");
    expect(homePlan?.requiredCapabilities).toContain("3d-webgl-canvas");

    const movementPlan = plans.find((p) => p.route === "/inspect-exploded-movement");
    expect(movementPlan?.pageRole).toContain("Mechanical Calibre Architecture");
    expect(movementPlan?.requiredCapabilities).toContain("movement-viewer");
    expect(movementPlan?.forbiddenPatterns).not.toContain("crud forms");

    const configuratorPlan = plans.find((p) => p.route === "/customize-dial-and-engraving");
    expect(configuratorPlan?.pageRole).toContain("Artisanal Dial Customization");
    expect(configuratorPlan?.requiredCapabilities).toContain("dial-configurator");

    const salonPlan = plans.find((p) => p.route === "/book-private-atelier-consultation");
    expect(salonPlan?.pageRole).toContain("Private Salon Consultation");
    expect(salonPlan?.requiredCapabilities).toContain("concierge-scheduler");

    const provenancePlan = plans.find((p) => p.route === "/register-and-verify-provenance-certificate");
    expect(provenancePlan?.pageRole).toContain("Provenance Registry");
    expect(provenancePlan?.requiredCapabilities).toContain("provenance-registry");

    const vaultPlan = plans.find((p) => p.route === "/collector-vault-portfolio");
    expect(vaultPlan?.pageRole).toContain("Collector Vault Portfolio");
    expect(vaultPlan?.requiredCapabilities).toContain("collector-vault");

    // Zero routes should have fallen through to generic scrollytelling narrative
    const scrollyFallbacks = plans.filter((p) => p.pageRole.includes("Scroll-Driven Narrative"));
    expect(scrollyFallbacks).toHaveLength(0);
  });

  it("TEST 3: FastDeterministicSanitizer harmonizes req.user id and userId in auth middleware and routes", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-auth-test-"));

    try {
      const serverDir = join(tempDir, "server");
      const middlewareDir = join(serverDir, "middleware");
      const routesDir = join(serverDir, "routes");
      mkdirSync(middlewareDir, { recursive: true });
      mkdirSync(routesDir, { recursive: true });

      // Mock auth middleware that sets req.user = user
      writeFileSync(
        join(middlewareDir, "auth.ts"),
        `import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; };
}
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.user = user as { id: number; email: string; };
  next();
};`,
        "utf8"
      );

      // Mock timepiece route that checks req.user?.userId
      writeFileSync(
        join(routesDir, "timepiece.ts"),
        `import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
const router = Router();
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized user context' });
  }
  return res.json({ success: true, data: [] });
});
export default router;`,
        "utf8"
      );

      // Run sanitizer
      FastDeterministicSanitizer.sanitizeProject(tempDir);

      const sanitizedMiddleware = readFileSync(join(middlewareDir, "auth.ts"), "utf8");
      expect(sanitizedMiddleware).toContain("userId");
      expect(sanitizedMiddleware).toContain("id: _uid");

      const sanitizedRoute = readFileSync(join(routesDir, "timepiece.ts"), "utf8");
      expect(sanitizedRoute).toContain("rawUserId");
      expect(sanitizedRoute).toContain("userId = rawUserId");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
