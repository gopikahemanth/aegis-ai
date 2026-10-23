import { resolve } from "node:path";
import { UndoManager } from "@aegis/ai-core";

export async function undoCommand() {
  const rawArgs = process.argv.slice(3);
  let projectPath = process.cwd();

  if (rawArgs.length > 0 && !rawArgs[0].startsWith("-")) {
    projectPath = resolve(rawArgs[0]);
  }

  console.log(`\n↺ [Aegis Undo] Reverting last eligible Aegis edit in: ${projectPath}...`);

  const result = UndoManager.undo(projectPath);

  if (!result.success) {
    console.error(`\n❌ Undo failed: ${result.error}\n`);
    process.exit(1);
  }

  console.log(`\n🎉 Successfully undone edit!`);
  console.log(`📌 Checkpoint ID: ${result.checkpointId}`);
  if (result.userRequest) {
    console.log(`📝 Undone Request: "${result.userRequest}"`);
  }
  if (result.restoredFiles.length > 0) {
    console.log(`📄 Restored File(s) (${result.restoredFiles.length}):`);
    for (const f of result.restoredFiles) {
      console.log(`   ✓ ${f}`);
    }
  }
  if (result.removedCreatedFiles.length > 0) {
    console.log(`🗑️ Removed Created File(s) (${result.removedCreatedFiles.length}):`);
    for (const f of result.removedCreatedFiles) {
      console.log(`   ✓ ${f}`);
    }
  }
  console.log("");
}
