import { ExecutionEngine } from "@aegis/agent-runtime";
import { ProviderError } from "@aegis/ai-core";

export async function createCommand() {
  const args = process.argv.slice(3);
  let imagePath: string | undefined;
  let targetDir: string | undefined;
  let designMode: string | undefined;
  let designModeHint: string | undefined;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: aegis create "<prompt>" [options]

Arguments:
  prompt                  Natural language description of the product to create

Options:
  -o, --output <dir>      Output directory for the generated project (must be empty for clean gen)
  --fresh                 Explicitly remove and recreate the target directory before clean generation
  --incremental           Allow mutating an existing target directory instead of requiring clean dir
  --design-mode=<mode>    Design archetype: auto, calm, dark, editorial, random, custom
  --image <path>          Path to an image mockup or screenshot to guide visual direction
  -h, --help              Show this help message
`);
    return;
  }

  const imageIdx = args.indexOf("--image");
  if (imageIdx !== -1 && args[imageIdx + 1]) {
    imagePath = args[imageIdx + 1];
    args.splice(imageIdx, 2);
  }

  const outputIdx = args.indexOf("--output") !== -1 ? args.indexOf("--output") : args.indexOf("-o");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    targetDir = args[outputIdx + 1];
    args.splice(outputIdx, 2);
  }


  // --design-mode=<mode-or-hint>
  // Accepted forms:
  //   --design-mode           → AUTO (default, same as omitting flag)
  //   --design-mode=calm      → USER_SELECTED with tonal hint "calm"
  //   --design-mode=dark      → USER_SELECTED with tonal hint "dark"
  //   --design-mode=editorial → USER_SELECTED with tonal hint "editorial"
  //   --design-mode=random    → RANDOM (random archetype, good for exploration)
  //   --design-mode=auto      → AUTO (explicit)
  const dmRawIdx = args.findIndex(a => a === "--design-mode" || a.startsWith("--design-mode="));
  if (dmRawIdx !== -1) {
    const dmRaw = args[dmRawIdx];
    if (dmRaw.includes("=")) {
      const val = dmRaw.split("=").slice(1).join("=").toLowerCase().trim();
      if (val === "auto") {
        designMode = "AUTO";
      } else if (val === "random") {
        designMode = "RANDOM";
      } else if (val === "custom") {
        designMode = "CUSTOM";
      } else {
        // Anything else is treated as a tone hint for USER_SELECTED mode
        designMode = "USER_SELECTED";
        designModeHint = val;
      }
    } else {
      designMode = "AUTO"; // bare --design-mode → AUTO
    }
    args.splice(dmRawIdx, 1);
  }

  let fresh = false;
  const freshIdx = args.indexOf("--fresh");
  if (freshIdx !== -1) {
    fresh = true;
    args.splice(freshIdx, 1);
  }

  let incremental = false;
  const incIdx = args.indexOf("--incremental");
  if (incIdx !== -1) {
    incremental = true;
    args.splice(incIdx, 1);
  }

  const prompt = args.join(" ");

  if (!prompt) {
    console.log("Please provide a prompt.");
    return;
  }

  if (fresh && targetDir) {
    const { resolve } = await import("node:path");
    const { existsSync, rmSync } = await import("node:fs");
    const basePath = process.env.INIT_CWD || process.cwd();
    const absTarget = resolve(basePath, targetDir);
    if (existsSync(absTarget)) {
      console.log(`[Fresh] 🧹 Removing target directory "${targetDir}" for fresh clean generation...`);
      rmSync(absTarget, { recursive: true, force: true });
    }
  }

  const engine = new ExecutionEngine();

  // Thread design mode into the orchestrator before execution
  if (designMode && typeof (engine as any).setDesignMode === "function") {
    (engine as any).setDesignMode(designMode, designModeHint);
  }

  if (designMode && designMode !== "AUTO") {
    console.log(`[DesignMode] ${designMode}${designModeHint ? ` (hint: "${designModeHint}")` : ""}`);
  }

  if (incremental) {
    console.log(`[Mode] INCREMENTAL EVOLUTION (modifying existing target)`);
  }

  console.log("Generating project...");

  try {
    const success = await engine.execute(prompt, imagePath, targetDir, { incremental });

    if (success) {
      console.log("🎉 Project generated successfully.");
    } else {
      console.log("❌ Project generation failed.");
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);

    if (errMessage.includes("GENERATION_TARGET_NOT_EMPTY")) {
      console.log();
      console.log("❌ Target Directory Not Empty");
      console.log();
      console.log("The target directory already contains a project. Clean generation requires a new/empty directory. Use a different --output path, delete the old generated project, or explicitly use --incremental if you intend to evolve that project.");
      console.log();
      console.log(`Suggested clean target:\n  pnpm cli create "${prompt}" --output ./projects/lumina-terra-v2`);
      return;
    }

    if (error instanceof ProviderError) {
      console.log();
      console.log("❌ AI Provider Error");
      console.log();
      console.log(error.message);

      if (error.retryAfter !== undefined) {
        console.log();
        console.log(
          `Retry after approximately ${error.retryAfter} seconds.`,
        );
      }

      console.log();
      console.log("Suggestions:");
      console.log("• Wait for the provider quota to reset.");
      console.log("• Configure another AI provider.");
      console.log("• Upgrade your provider plan if needed.");

      return;
    }

    throw error;
  }
}
