import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { EditEngine } from "@aegis/ai-core";

export async function editCommand() {
  const rawArgs = process.argv.slice(3);

  let dryRun = false;
  let previewOnly = false;
  let autoApprove = false;
  let jsonOutput = false;
  let force = false;

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
    } else if (arg === "--force" || arg === "-f") {
      force = true;
    } else {
      filteredArgs.push(arg);
    }
  }

  if (filteredArgs.length === 0) {
    console.log("Usage: aegis edit [--dry-run] [--preview] [--yes] [--json] [project-path] <instruction>");
    console.log("Examples:");
    console.log("  aegis edit \"Add a wishlist and connect it to the logged-in user\"");
    console.log("  aegis edit \"Remove the blog and clean up obsolete files\"");
    console.log("  aegis edit \"Change the theme to editorial cream and dark green\"");
    console.log("  aegis edit ./my-app \"Only redesign the home page\"");
    return;
  }

  let projectPath: string;
  let instruction: string;

  // Check if first argument is a directory or path
  const firstArg = filteredArgs[0];
  const isPathLike =
    firstArg.startsWith(".") ||
    firstArg.startsWith("/") ||
    firstArg.startsWith("\\") ||
    /^[A-Za-z]:[\\/]/.test(firstArg) ||
    (filteredArgs.length >= 2 && existsSync(resolve(firstArg)));

  if (isPathLike && filteredArgs.length >= 2) {
    projectPath = resolve(firstArg);
    instruction = filteredArgs.slice(1).join(" ");
  } else {
    projectPath = process.cwd();
    instruction = filteredArgs.join(" ");
  }

  console.log(`\n⚙️ [Aegis Edit] Initiating brownfield edit on: ${projectPath}`);
  console.log(`📝 Instruction: "${instruction}"\n`);

  const engine = new EditEngine();
  const result = await engine.edit(instruction, projectPath, {
    dryRun: dryRun || previewOnly,
    force,
  });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
    return;
  }

  if (!result.success) {
    console.error(`\n❌ Edit failed: ${result.error}`);
    if (result.rolledBack) {
      console.error(`↺ Project successfully restored to pre-change state.`);
    }
    console.error("");
    process.exit(1);
  }

  if (dryRun || previewOnly) {
    console.log(`📋 Plan generated successfully (Dry Run - Zero files modified):`);
    if (result.plan) {
      console.log(`   Operation: ${result.plan.operationType}`);
      console.log(`   Risk Level: ${result.plan.riskLevel}`);
      console.log(`   Planned File Actions (${result.plan.actions.length}):`);
      for (const a of result.plan.actions) {
        console.log(`     - [${a.action.toUpperCase()}] ${a.filePath} (${a.reason})`);
      }
    }
    console.log("");
    return;
  }

  console.log(`\n🎉 Edit successfully executed, verified, and committed!`);
  if (result.checkpointId) {
    console.log(`📌 Checkpoint ID: ${result.checkpointId} (use 'aegis undo' to revert if needed)`);
  }
  console.log(`📦 Touched Files (${result.touchedFiles.length}):`);
  for (const f of result.touchedFiles) {
    console.log(`   ✓ ${f}`);
  }
  console.log("");
}
