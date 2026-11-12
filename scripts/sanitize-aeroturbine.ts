import { FastDeterministicSanitizer } from "../packages/ai-core/src/governance/fast-sanitizer.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.resolve(__dirname, "../generated/aeroturbine-iq");
  console.log(`[Test] Running FastDeterministicSanitizer on ${projectRoot}...`);
  await FastDeterministicSanitizer.sanitizeProject(projectRoot);
  console.log(`[Test] Sanitization complete.`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
