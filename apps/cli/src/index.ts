#!/usr/bin/env node
import { showBanner } from "./ui/banner.js";

import { runCLI } from "./cli.js";

async function main() {
  showBanner();

  try {
    await runCLI();
  } catch (err: any) {
    console.error(`\n❌ Execution Error: ${err?.message || err}`);
    if (err?.stack) {
      console.error(`\n=== STACK TRACE ===\n${err.stack}\n===================`);
    }
    process.exit(1);
  }
}

main();
