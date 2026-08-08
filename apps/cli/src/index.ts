#!/usr/bin/env node
import { showBanner } from "./ui/banner.js";

import { runCLI } from "./cli.js";

async function main() {
  showBanner();

  try {
    await runCLI();
  } catch (error: any) {
    console.error("\n=== FULL EXECUTION ERROR ===");
    console.error(error);
    console.error(error instanceof Error ? error.stack : "NO STACK");
    console.error("============================\n");
    process.exit(1);
  }
}

main();
