/**
 * CLI Rename Command — Aegis V2.3 Project 2 Phase 3
 *
 * Provides safe, AST-aware symbol renaming:
 *   aegis rename <OldName> <NewName> --file <path> [--dry-run] [--preview] [--yes] [--json]
 */

import { resolve } from "node:path";
import readline from "node:readline";
import {
  RenamePreviewEngine,
  SymbolRenameExecutor,
  type RenamePreview,
} from "@aegis/ai-core";

export async function renameCommand() {
  const rawArgs = process.argv.slice(3);

  let dryRun = false;
  let previewOnly = false;
  let autoApprove = false;
  let jsonOutput = false;
  let sourceFile: string | undefined;

  const positional: string[] = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--preview") {
      previewOnly = true;
    } else if (arg === "--yes" || arg === "-y") {
      autoApprove = true;
    } else if (arg === "--json") {
      jsonOutput = true;
    } else if (arg === "--file" || arg === "-f") {
      sourceFile = rawArgs[++i];
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (positional.length < 2 || !sourceFile) {
    console.log("Usage: aegis rename <OldName> <NewName> --file <relative-path> [--dry-run] [--preview] [--yes] [--json]");
    console.log("Examples:");
    console.log("  aegis rename getUserById findUserById --file src/services/userService.ts");
    console.log("  aegis rename Button PrimaryButton --file src/components/Button.tsx --preview");
    return;
  }

  const oldSymbolName = positional[0];
  const newSymbolName = positional[1];
  const projectPath = process.cwd();

  // 1. Generate In-Memory Side-Effect-Free Preview
  let preview: RenamePreview;
  try {
    preview = RenamePreviewEngine.generatePreview({
      projectPath,
      sourceFile,
      symbolName: oldSymbolName,
      newName: newSymbolName,
    });
  } catch (err: any) {
    console.error(`\n❌ Failed to generate rename preview: ${err.message}\n`);
    process.exit(1);
  }

  // 2. Handle JSON Output mode
  if (jsonOutput) {
    console.log(JSON.stringify(preview, null, 2));
    if (!preview.isApplyAllowed) {
      process.exit(1);
    }
    return;
  }

  // 3. Render Terminal Output
  console.log(`\n🔍 Target: ${preview.sourceFile}:${oldSymbolName} (${preview.symbolKind})`);
  console.log(`🏷️ Rename: "${oldSymbolName}" ➔ "${newSymbolName}"`);
  console.log(`📁 Files Affected (${preview.requiredFiles.length}): ${preview.requiredFiles.join(", ")}`);

  if (preview.conflicts.length > 0) {
    console.error(`\n🛑 Conflicts detected:\n  - ${preview.conflicts.join("\n  - ")}`);
  }

  // 4. Handle Dry-Run & Preview-Only Modes
  if (dryRun || previewOnly) {
    if (!preview.isApplyAllowed) {
      console.log("\n🛑 Dry-run completed: Refactoring would be BLOCKED.\n");
      process.exit(1);
    } else {
      console.log("\n✓ Dry-run completed successfully: Zero files modified.\n");
      process.exit(0);
    }
  }

  if (!preview.isApplyAllowed) {
    console.error("\n❌ Rename blocked: Safety checks failed. Cannot proceed.\n");
    process.exit(1);
  }

  // 5. Interactive Approval Prompt
  let shouldApply = autoApprove;
  if (!shouldApply) {
    shouldApply = await promptUserApproval(preview);
  }

  if (!shouldApply) {
    console.log("Operation cancelled by user. Zero files modified.\n");
    process.exit(0);
  }

  // 6. Execute Transactional Rename
  console.log(`\n🚀 Applying AST symbol rename on dedicated branch "${preview.branchName}"...\n`);

  const executor = new SymbolRenameExecutor(projectPath);
  const result = await executor.execute({
    projectPath,
    sourceFile,
    symbolName: oldSymbolName,
    newName: newSymbolName,
    preview,
  });

  if (result.success) {
    console.log(`\n🎉 Successfully renamed symbol across ${result.touchedFiles.length} file(s)!`);
    console.log(`🌿 Changes staged on branch: "${result.branchName || preview.branchName}"`);
    console.log(`🔒 Default branch remains completely untouched.\n`);
  } else {
    console.error(`\n❌ Symbol rename failed: ${result.error}`);
    console.error(`↺ Transaction rolled back to clean pre-change state.\n`);
    process.exit(1);
  }
}

async function promptUserApproval(preview: RenamePreview): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    console.log("\n\x1b[1m\x1b[33mChoose an action:\x1b[0m");
    console.log("  [1] Apply rename on dedicated feature branch");
    console.log("  [2] Cancel (no modifications)");
    console.log("  [3] Show full unified diff\n");

    const answer = await new Promise<string>((resolve) => {
      rl.question("Select option [1/2/3]: ", (ans) => resolve(ans.trim()));
    });

    if (answer === "1" || answer.toLowerCase() === "apply" || answer.toLowerCase() === "y") {
      rl.close();
      return true;
    } else if (answer === "2" || answer.toLowerCase() === "cancel" || answer.toLowerCase() === "n") {
      rl.close();
      return false;
    } else if (answer === "3" || answer.toLowerCase() === "diff") {
      console.log("\n" + "=".repeat(70));
      console.log("                   FULL UNIFIED DIFF PREVIEW");
      console.log("=".repeat(70));
      for (const diff of preview.fileDiffs) {
        console.log(`\n📄 ${diff.filePath}:`);
        console.log(diff.unifiedDiff);
      }
      console.log("\n" + "=".repeat(70) + "\n");
    } else {
      console.log(`Invalid choice: "${answer}". Please enter 1, 2, or 3.\n`);
    }
  }
}
