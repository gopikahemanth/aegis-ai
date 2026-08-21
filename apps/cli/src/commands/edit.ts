import { resolve } from "node:path";
import readline from "node:readline";
import {
  PatchPreviewEngine,
  ExistingSymbolModifier,
  type PatchPreview,
} from "@aegis/ai-core";

export async function editCommand() {
  const rawArgs = process.argv.slice(3);

  let dryRun = false;
  let previewOnly = false;
  let autoApprove = false;
  let jsonOutput = false;

  const filteredArgs: string[] = [];

  for (const arg of rawArgs) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--preview") {
      previewOnly = true;
    } else if (arg === "--yes" || arg === "-y") {
      autoApprove = true;
    } else if (arg === "--json") {
      jsonOutput = true;
    } else {
      filteredArgs.push(arg);
    }
  }

  if (filteredArgs.length < 2) {
    console.log("Usage: aegis edit [--dry-run] [--preview] [--yes] [--json] <project-path> <instruction>");
    console.log("Examples:");
    console.log("  aegis edit ./my-app \"Add optional priority support to tasks\"");
    console.log("  aegis edit --dry-run ./my-app \"Add optional notes support to expenses\"");
    console.log("  aegis edit --preview ./my-app \"Add dark mode toggle to navbar\"");
    return;
  }

  const projectPath = resolve(filteredArgs[0]);
  const instruction = filteredArgs.slice(1).join(" ");

  // 1. Generate In-Memory Side-Effect-Free Preview
  let preview: PatchPreview;
  try {
    preview = PatchPreviewEngine.generatePreview({
      projectPath,
      userRequest: instruction,
    });
  } catch (err: any) {
    console.error(`\n❌ Failed to generate patch preview: ${err.message}\n`);
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

  // 3. Render Formatted Terminal Preview
  console.log(PatchPreviewEngine.formatCliPreview(preview));

  // 4. Handle Dry-Run & Preview-Only Modes (No prompt, exit immediately)
  if (dryRun || previewOnly) {
    if (!preview.isApplyAllowed) {
      console.log("🛑 Dry-run completed: Feature would be BLOCKED from application.\n");
      process.exit(1);
    } else {
      console.log("✓ Dry-run completed successfully: Zero files modified, zero Git branches created.\n");
      process.exit(0);
    }
  }

  // 5. Blocked Preview Handling (No approval option allowed)
  if (!preview.isApplyAllowed || preview.riskLevel === "BLOCKED") {
    console.error("❌ Application blocked: Mandatory safety checks failed. Cannot proceed.\n");
    process.exit(1);
  }

  // 6. Interactive Approval Prompt (or auto-approve via --yes)
  let shouldApply = autoApprove;

  if (!shouldApply) {
    shouldApply = await promptUserApproval(preview);
  }

  if (!shouldApply) {
    console.log("Operation cancelled by user. Zero files modified.\n");
    process.exit(0);
  }

  // 7. Execute Verified Modification on Feature Branch
  console.log(`\n🚀 Applying AST modifications on dedicated feature branch "${preview.branchName}"...\n`);

  const modifier = new ExistingSymbolModifier(projectPath);
  const result = await modifier.modify({
    targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
    userRequest: instruction,
    patches: preview.filePatches,
    preview,
  });

  if (result.success) {
    console.log(`\n🎉 Successfully applied, tested, and committed patch!`);
    console.log(`🌿 Changes staged and committed on branch: "${result.branchName || preview.branchName}"`);
    console.log(`🔒 Default/main branch remains completely untouched.\n`);
  } else {
    console.error(`\n❌ Modification failed: ${result.error}`);
    console.error(`↺ Transaction rolled back to clean pre-change state.\n`);
    process.exit(1);
  }
}

async function promptUserApproval(preview: PatchPreview): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    console.log("\x1b[1m\x1b[33mChoose an action:\x1b[0m");
    console.log("  [1] Apply patch on dedicated feature branch");
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
