import { showBanner } from "./ui/banner.js";
import { runCLI } from "./cli.js";

async function main() {
  showBanner();

  await runCLI();
}

main();
