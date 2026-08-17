/**
 * DependencyContract
 *
 * Provides a locked, deterministic dependency specification.
 * Validates dependencies against duplicate packages, package manager locks, and security considerations.
 */

import { createHash } from "node:crypto";
import type { TechnologyContract } from "./technology-contract.js";

export type DependencyConsumer = "frontend" | "backend" | "shared" | "development";

export interface DependencyItem {
  packageName: string;
  versionConstraint: string;
  purpose: string;
  consumer: DependencyConsumer;
  required: boolean;
  isDirect: boolean;
  securityConsiderations?: string;
  installSource: "npm_registry" | "workspace";
}

export interface DependencyContract {
  version: number;
  packageManager: "pnpm" | "npm" | "yarn";
  dependencies: DependencyItem[];
  devDependencies: DependencyItem[];
  duplicatePackagesDetected: string[];
  dependencyHash: string;
  lockedAt: string;
}

export class DependencyContractManager {
  /**
   * Known functional categories for duplicate package detection.
   */
  private static readonly FUNCTIONAL_GROUPS: Record<string, string[]> = {
    http_client: ["axios", "got", "node-fetch", "ky", "superagent", "request"],
    date_library: ["moment", "dayjs", "date-fns", "luxon"],
    orm: ["@prisma/client", "drizzle-orm", "typeorm", "mongoose", "sequelize"],
    state_management: ["zustand", "redux", "@reduxjs/toolkit", "mobx", "recoil", "jotai"],
    css_framework: ["tailwindcss", "bootstrap", "bulma", "styled-components", "@emotion/react"],
    icons: ["lucide-react", "react-icons", "@heroicons/react", "@tabler/icons-react"],
  };

  /**
   * Build a canonical DependencyContract from the locked TechnologyContract.
   */
  public static build(
    techContract: TechnologyContract,
    packageManager: "pnpm" | "npm" | "yarn" = "pnpm",
    additionalPackages: string[] = []
  ): DependencyContract {
    const dependencies: DependencyItem[] = [];
    const devDependencies: DependencyItem[] = [];

    const isNext = techContract.architectureProfile.includes("NEXTJS");
    const isStatic = techContract.applicationType.toUpperCase().includes("STATIC");

    // ── Frontend dependencies ────────────────────────────────────────────────
    if (!isStatic) {
      if (isNext) {
        dependencies.push({
          packageName: "next",
          versionConstraint: "^15.1.0",
          purpose: "Next.js fullstack React framework",
          consumer: "shared",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        });
      }

      dependencies.push(
        {
          packageName: "react",
          versionConstraint: "^19.0.0",
          purpose: "Core UI rendering library",
          consumer: "frontend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "react-dom",
          versionConstraint: "^19.0.0",
          purpose: "DOM renderer for React",
          consumer: "frontend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "lucide-react",
          versionConstraint: "^0.475.0",
          purpose: "Standard SVG UI icons",
          consumer: "frontend",
          required: false,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "clsx",
          versionConstraint: "^2.1.1",
          purpose: "Conditional CSS class constructor",
          consumer: "frontend",
          required: false,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "tailwind-merge",
          versionConstraint: "^3.0.0",
          purpose: "Conflict-free Tailwind class merge utility",
          consumer: "frontend",
          required: false,
          isDirect: true,
          installSource: "npm_registry",
        }
      );
    }

    // ── Backend dependencies ─────────────────────────────────────────────────
    const hasBackend = techContract.technologies.some(t => t.category === "backend" && !t.name.toLowerCase().includes("next"));
    if (hasBackend) {
      dependencies.push(
        {
          packageName: "express",
          versionConstraint: "^4.21.2",
          purpose: "HTTP REST API framework",
          consumer: "backend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "cors",
          versionConstraint: "^2.8.5",
          purpose: "Cross-Origin Resource Sharing middleware",
          consumer: "backend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "dotenv",
          versionConstraint: "^16.4.7",
          purpose: "Environment variable loader",
          consumer: "backend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        }
      );
    }

    // ── Database & ORM dependencies ──────────────────────────────────────────
    const hasPrisma = techContract.technologies.some(t => t.category === "orm" && t.name.toLowerCase().includes("prisma"));
    if (hasPrisma) {
      dependencies.push({
        packageName: "@prisma/client",
        versionConstraint: "^6.4.0",
        purpose: "Auto-generated type-safe database client",
        consumer: "backend",
        required: true,
        isDirect: true,
        installSource: "npm_registry",
      });

      devDependencies.push({
        packageName: "prisma",
        versionConstraint: "^6.4.0",
        purpose: "Prisma CLI for database migrations and schema generation",
        consumer: "development",
        required: true,
        isDirect: true,
        installSource: "npm_registry",
      });
    }

    // ── Auth dependencies ────────────────────────────────────────────────────
    const hasJwt = techContract.technologies.some(t => t.category === "auth" && t.name.toLowerCase().includes("jwt"));
    if (hasJwt) {
      dependencies.push(
        {
          packageName: "jsonwebtoken",
          versionConstraint: "^9.0.2",
          purpose: "JWT token signing and verification",
          consumer: "backend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "bcryptjs",
          versionConstraint: "^3.0.2",
          purpose: "Password hashing and verification",
          consumer: "backend",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        }
      );
      devDependencies.push(
        {
          packageName: "@types/jsonwebtoken",
          versionConstraint: "^9.0.8",
          purpose: "TypeScript definitions for jsonwebtoken",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "@types/bcryptjs",
          versionConstraint: "^2.4.6",
          purpose: "TypeScript definitions for bcryptjs",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        }
      );
    }

    // ── Standard Dev Dependencies ────────────────────────────────────────────
    devDependencies.push(
      {
        packageName: "typescript",
        versionConstraint: "^5.8.2",
        purpose: "TypeScript compiler",
        consumer: "development",
        required: true,
        isDirect: true,
        installSource: "npm_registry",
      },
      {
        packageName: "@types/node",
        versionConstraint: "^22.13.0",
        purpose: "Node.js runtime TypeScript definitions",
        consumer: "development",
        required: true,
        isDirect: true,
        installSource: "npm_registry",
      }
    );

    if (!isStatic && !isNext) {
      devDependencies.push(
        {
          packageName: "vite",
          versionConstraint: "^6.2.0",
          purpose: "Vite next-gen frontend build tool and dev server",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "@vitejs/plugin-react",
          versionConstraint: "^4.3.4",
          purpose: "Vite React Fast Refresh plugin",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "tailwindcss",
          versionConstraint: "^3.4.17",
          purpose: "Utility-first CSS compiler",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "autoprefixer",
          versionConstraint: "^10.4.20",
          purpose: "PostCSS vendor prefixer",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        },
        {
          packageName: "postcss",
          versionConstraint: "^8.5.3",
          purpose: "PostCSS tool for transforming CSS with plugins",
          consumer: "development",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        }
      );
    }

    // Add any additional packages
    for (const pkg of additionalPackages) {
      if (!dependencies.some(d => d.packageName === pkg) && !devDependencies.some(d => d.packageName === pkg)) {
        dependencies.push({
          packageName: pkg,
          versionConstraint: "latest",
          purpose: "Additional required application package",
          consumer: "shared",
          required: true,
          isDirect: true,
          installSource: "npm_registry",
        });
      }
    }

    // Check for duplicate functional packages
    const allPkgNames = [...dependencies, ...devDependencies].map(d => d.packageName);
    const duplicatesDetected = this.detectDuplicates(allPkgNames);

    // Compute deterministic dependency hash
    const stablePayload = {
      packageManager,
      deps: [...dependencies].map(d => ({ name: d.packageName, ver: d.versionConstraint })).sort((a, b) => a.name.localeCompare(b.name)),
      devDeps: [...devDependencies].map(d => ({ name: d.packageName, ver: d.versionConstraint })).sort((a, b) => a.name.localeCompare(b.name)),
    };

    const dependencyHash = createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex").slice(0, 12);

    return {
      version: 1,
      packageManager,
      dependencies,
      devDependencies,
      duplicatePackagesDetected: duplicatesDetected,
      dependencyHash,
      lockedAt: new Date().toISOString(),
    };
  }

  /**
   * Detect packages serving duplicate purposes.
   */
  public static detectDuplicates(packageNames: string[]): string[] {
    const duplicates: string[] = [];
    const pkgSet = new Set(packageNames.map(p => p.toLowerCase()));

    for (const [groupName, packages] of Object.entries(this.FUNCTIONAL_GROUPS)) {
      const matches = packages.filter(p => pkgSet.has(p.toLowerCase()));
      if (matches.length > 1) {
        duplicates.push(`DUPLICATE_DEPENDENCY [${groupName}]: Found multiple competing packages: [${matches.join(", ")}]`);
      }
    }

    return duplicates;
  }
}
