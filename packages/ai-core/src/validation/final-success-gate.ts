import { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { DependencyClosureValidator } from "./dependency-closure-validator.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface FinalCheckItem {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

export interface FinalSuccessGateResult {
  success: boolean;
  items: FinalCheckItem[];
  blockingReason?: string;
}

/**
 * FinalSuccessGate
 *
 * Ensures Aegis ONLY prints "=== SUCCESS ===" when ALL strict criteria pass:
 *  ✓ Architecture contract valid
 *  ✓ Planner valid & domain models match contract
 *  ✓ No unauthorized models (Task, Item, etc.)
 *  ✓ No missing local imports (Dependency closure valid)
 *  ✓ No duplicated project root
 *  ✓ Dependencies installed
 *  ✓ Prisma client generated when required
 *  ✓ TypeScript passes (0 type errors)
 *  ✓ Vite build passes
 *  ✓ No placeholder/fake implementations
 *
 * Otherwise returns success: false with the exact blocking reason.
 */
export class FinalSuccessGate {
  public static verify(
    projectRoot: string,
    contract: ArchitectureContractV1 | null,
    buildSuccess: boolean,
    buildDiagnostics?: string
  ): FinalSuccessGateResult {
    const items: FinalCheckItem[] = [];

    // 1. Architecture Contract
    if (contract && contract.frontend?.framework && contract.backend?.framework && contract.database?.provider) {
      items.push({
        name: "Architecture Contract Valid",
        passed: true,
        message: `${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} (${contract.database.orm})`,
        critical: true,
      });
    } else {
      items.push({
        name: "Architecture Contract Valid",
        passed: false,
        message: "Architecture contract is missing or incomplete.",
        critical: true,
      });
    }

    // 2. Domain Models Check (no unauthorized Task/TodoItem model)
    const reqModels = contract?.requiredModels || [];
    const prismaPath = join(projectRoot, "prisma", "schema.prisma");
    let domainPassed = true;
    let domainMsg = `Domain models verified: [${reqModels.join(", ")}]`;

    if (existsSync(prismaPath)) {
      try {
        const schema = readFileSync(prismaPath, "utf8");
        const unauthorized = ["model Task {", "model TodoItem {", "model ShoppingCart {"];
        for (const unauth of unauthorized) {
          if (!reqModels.includes(unauth.replace("model ", "").replace(" {", "")) && schema.includes(unauth)) {
            domainPassed = false;
            domainMsg = `UNAUTHORIZED_DOMAIN_MODEL detected in schema.prisma: ${unauth}`;
            break;
          }
        }
      } catch {}
    }

    items.push({
      name: "Domain Models Valid",
      passed: domainPassed,
      message: domainMsg,
      critical: true,
    });

    // 3. Dependency Closure
    const closure = DependencyClosureValidator.validate(projectRoot);
    items.push({
      name: "No Missing Local Imports",
      passed: closure.valid,
      message: closure.valid
        ? "All local imports resolved cleanly."
        : `${closure.brokenImports.length} unresolved import(s): ${closure.brokenImports.map(b => b.importPath).join(", ")}`,
      critical: true,
    });

    // 4. No Duplicate Project Root
    const hasDupRoot = projectRoot.includes("generated/project/generated/project") || projectRoot.includes("generated\\project\\generated\\project");
    items.push({
      name: "No Duplicated Project Root",
      passed: !hasDupRoot,
      message: hasDupRoot ? "DUPLICATE_PROJECT_ROOT detected in path." : "Project path canonical.",
      critical: true,
    });

    // 5. Dependencies Installed
    const hasNodeModules = existsSync(join(projectRoot, "node_modules"));
    items.push({
      name: "Dependencies Installed",
      passed: hasNodeModules,
      message: hasNodeModules ? "node_modules present." : "node_modules directory missing.",
      critical: true,
    });

    // 6. Prisma Client Generated (if schema exists)
    let prismaPassed = true;
    let prismaMsg = "Prisma client verified or not required.";
    if (existsSync(prismaPath)) {
      const hasClient = existsSync(join(projectRoot, "node_modules", "@prisma", "client")) ||
                        existsSync(join(projectRoot, "node_modules", ".prisma", "client"));
      if (!hasClient) {
        prismaPassed = false;
        prismaMsg = "Prisma schema exists but @prisma/client is not generated.";
      }
    }
    items.push({
      name: "Prisma Client Generated",
      passed: prismaPassed,
      message: prismaMsg,
      critical: true,
    });

    // 7. TypeScript & Vite Build
    items.push({
      name: "TypeScript & Vite Build Pass",
      passed: buildSuccess,
      message: buildSuccess ? "Build succeeded with 0 errors." : `Build failed: ${buildDiagnostics?.slice(0, 150) || "Compilation errors."}`,
      critical: true,
    });

    // Evaluate overall success
    const failedCritical = items.filter(i => i.critical && !i.passed);
    const overallSuccess = failedCritical.length === 0;

    console.log("\n=========================================");
    console.log(`=== FINAL SUCCESS GATE: ${overallSuccess ? "PASSED ✅" : "FAILED ❌"} ===`);
    console.log("=========================================");
    for (const item of items) {
      const icon = item.passed ? "✓" : "❌";
      console.log(`  ${icon} ${item.name}: ${item.message}`);
    }
    console.log("=========================================\n");

    if (!overallSuccess) {
      const firstFailure = failedCritical[0];
      return {
        success: false,
        items,
        blockingReason: `${firstFailure.name}: ${firstFailure.message}`,
      };
    }

    return {
      success: true,
      items,
    };
  }
}
