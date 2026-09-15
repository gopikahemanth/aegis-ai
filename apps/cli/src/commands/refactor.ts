/**
 * CLI Refactor Command — Aegis V2.3 Project 2 Phase 7
 *
 * Provides interactive, safe structural refactoring with in-memory semantic verification:
 *   aegis refactor move <Symbol> --from <file> --to <file> [--preview] [--dry-run] [--yes] [--json]
 *   aegis refactor extract <Symbol> --from <file> --to <file>
 *   aegis refactor split <file> --symbols A,B --to <file>
 *   aegis refactor merge <source> --into <destination>
 *   aegis refactor imports <file>
 *   aegis refactor exports <file>
 *   aegis refactor signature <Symbol> --file <file>
 */

import readline from "node:readline";
import {
  StructuralTransformationEngine,
  StructuralRefactoringExecutor,
  SemanticRefactoringVerifier,
  type StructuralRefactoringPlan,
} from "@aegis/ai-core";

export async function refactorCommand() {
  const rawArgs = process.argv.slice(3);

  if (rawArgs.length === 0 || rawArgs.includes("--help") || rawArgs.includes("-h")) {
    printHelp();
    return;
  }

  const subAction = rawArgs[0];
  let dryRun = false;
  let previewOnly = false;
  let autoApprove = false;
  let jsonOutput = false;
  let fromFile: string | undefined;
  let toFile: string | undefined;
  let symbolsStr: string | undefined;
  let targetSymbol: string | undefined;

  for (let i = 1; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--preview") previewOnly = true;
    else if (arg === "--yes" || arg === "-y") autoApprove = true;
    else if (arg === "--json") jsonOutput = true;
    else if (arg === "--from" || arg === "-f") fromFile = rawArgs[++i];
    else if (arg === "--to" || arg === "-t" || arg === "--into") toFile = rawArgs[++i];
    else if (arg === "--symbols" || arg === "-s") symbolsStr = rawArgs[++i];
    else if (arg === "--file") fromFile = rawArgs[++i];
    else if (!arg.startsWith("-") && !targetSymbol) targetSymbol = arg;
  }

  const projectRoot = process.cwd();
  const engine = new StructuralTransformationEngine(projectRoot);
  const verifier = new SemanticRefactoringVerifier(projectRoot);
  const executor = new StructuralRefactoringExecutor(projectRoot);

  let plan: StructuralRefactoringPlan;

  try {
    switch (subAction) {
      case "move": {
        if (!targetSymbol || !fromFile || !toFile) {
          console.error("Usage: aegis refactor move <Symbol> --from <file> --to <file>");
          process.exit(1);
        }
        plan = engine.transformMoveSymbol({
          kind: "MOVE_SYMBOL",
          projectPath: projectRoot,
          sourceFile: fromFile,
          symbolName: targetSymbol,
          destinationFile: toFile,
        });
        break;
      }
      case "extract": {
        if (!targetSymbol || !fromFile || !toFile) {
          console.error("Usage: aegis refactor extract <Symbol> --from <file> --to <file>");
          process.exit(1);
        }
        plan = engine.extractSymbols({
          sourceFile: fromFile,
          symbolNames: [targetSymbol],
          destinationFile: toFile,
        });
        break;
      }
      case "split": {
        const syms = symbolsStr ? symbolsStr.split(",").map(s => s.trim()) : [];
        if (!fromFile || !toFile || syms.length === 0) {
          console.error("Usage: aegis refactor split <file> --symbols A,B --to <file>");
          process.exit(1);
        }
        plan = engine.splitModule({
          sourceFile: fromFile,
          groups: [{ destinationFile: toFile, symbolNames: syms }],
        });
        break;
      }
      case "merge": {
        if (!fromFile || !toFile) {
          console.error("Usage: aegis refactor merge <source> --into <destination>");
          process.exit(1);
        }
        plan = engine.mergeModules({
          sourceFiles: [fromFile],
          destinationFile: toFile,
        });
        break;
      }
      default: {
        console.error(`Unknown refactor action: ${subAction}`);
        printHelp();
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`\n❌ Failed to generate refactoring plan: ${err.message}\n`);
    process.exit(1);
  }

  // Run Semantic Verification
  const semanticResult = verifier.verify(plan, { skipTests: true, skipBuild: true });

  if (jsonOutput) {
    console.log(JSON.stringify({ plan, semanticResult }, null, 2));
    if (!plan.isApplyAllowed || !semanticResult.passed) process.exit(1);
    return;
  }

  // Display Preview
  console.log(`\n======================================================`);
  console.log(`🛡️  AEGIS STRUCTURAL REFACTORING PREVIEW`);
  console.log(`======================================================`);
  console.log(`Kind:          ${plan.kind}`);
  console.log(`Source:        ${plan.sourceFile}`);
  console.log(`Destination:   ${plan.destinationFile || "N/A"}`);
  console.log(`Risk Level:    ${plan.riskLevel}`);
  console.log(`Impact Status: ${plan.impactStatus}`);
  console.log(`Plan Hash:     ${plan.planHash}`);
  console.log(`Patch Hash:    ${plan.patchHash}`);
  console.log(`Verify Hash:   ${semanticResult.verificationHash}`);
  console.log(`\nSemantic Verification:`);
  console.log(`  AST Validity:      ${semanticResult.passed ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Imports/Exports:   ${semanticResult.unresolvedImports.length === 0 && semanticResult.unresolvedExports.length === 0 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Symbol References: ${semanticResult.unresolvedSymbols.length === 0 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Public API Gate:   ${semanticResult.status !== "PUBLIC_API_BREAK" ? "✓ PASS" : "✗ BLOCKED"}`);
  console.log(`======================================================\n`);

  if (!plan.isApplyAllowed || !semanticResult.passed) {
    console.error(`🛑 Refactoring BLOCKED: Safety checks failed.`);
    if (plan.blockedReasons.length > 0) {
      console.error(`  - Reasons: ${plan.blockedReasons.join("; ")}`);
    }
    if (semanticResult.errors.length > 0) {
      console.error(`  - Verification Errors: ${semanticResult.errors.join("; ")}`);
    }
    process.exit(1);
  }

  if (dryRun || previewOnly) {
    console.log(`✓ Dry-run completed successfully: Zero files modified on disk.\n`);
    process.exit(0);
  }

  if (autoApprove) {
    console.log(`🚀 Executing refactoring on isolated feature branch...`);
    const execResult = await executor.execute(plan, { skipTests: true, skipBuild: true });
    if (execResult.success) {
      console.log(`\n✅ Refactoring completed on branch: ${execResult.branchName}`);
    } else {
      console.error(`\n❌ Execution failed: ${execResult.error}`);
      process.exit(1);
    }
    return;
  }

  // Interactive prompt
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(`Choose action: [1] Apply  [2] Cancel  [3] Show full diff > `, async answer => {
    rl.close();
    if (answer.trim() === "1") {
      console.log(`🚀 Executing refactoring on isolated feature branch...`);
      const execResult = await executor.execute(plan, { skipTests: true, skipBuild: true });
      if (execResult.success) {
        console.log(`\n✅ Refactoring completed on branch: ${execResult.branchName}`);
      } else {
        console.error(`\n❌ Execution failed: ${execResult.error}`);
        process.exit(1);
      }
    } else if (answer.trim() === "3") {
      console.log(`\nPatches (${plan.patchOperations.length}):`);
      for (const op of plan.patchOperations) {
        console.log(`- [${op.operationKind}] ${op.filePath}: ${op.description}`);
      }
    } else {
      console.log("Operation cancelled. Zero files modified.");
    }
  });
}

function printHelp() {
  console.log(`
Aegis Structural Refactoring CLI

Usage:
  aegis refactor move <Symbol> --from <file> --to <file>
  aegis refactor extract <Symbol> --from <file> --to <file>
  aegis refactor split <file> --symbols A,B --to <file>
  aegis refactor merge <source> --into <destination>

Options:
  --preview           Generate preview and exit
  --dry-run           Validate and verify without modifying disk
  --yes, -y           Apply changes automatically without prompt
  --json              Output machine-readable JSON plan
`);
}
