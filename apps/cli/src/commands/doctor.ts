import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as process from "node:process";

interface CheckResult {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

function check(label: string, fn: () => { status: "pass" | "warn" | "fail"; detail: string }): CheckResult {
  try {
    const result = fn();
    return { label, ...result };
  } catch (err: any) {
    return { label, status: "fail", detail: err.message };
  }
}

function printResult(r: CheckResult) {
  const icon = r.status === "pass" ? "✓" : r.status === "warn" ? "⚠" : "✗";
  const color = r.status === "pass" ? "\x1b[32m" : r.status === "warn" ? "\x1b[33m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`  ${color}${icon}${reset}  ${r.label.padEnd(36)} ${r.detail}`);
}

export async function doctorCommand() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║              Aegis AI — System Doctor                ║
║   Checking environment health before you generate.  ║
╚══════════════════════════════════════════════════════╝
`);

  const results: CheckResult[] = [];

  // ── Node.js Version ────────────────────────────────────────────────────────
  results.push(check("Node.js version", () => {
    const version = process.version;
    const major = parseInt(version.replace("v", "").split(".")[0], 10);
    if (major >= 20) return { status: "pass", detail: version };
    if (major >= 18) return { status: "warn", detail: `${version} (Node 20+ recommended)` };
    return { status: "fail", detail: `${version} — Aegis requires Node 18+` };
  }));

  // ── pnpm Available ─────────────────────────────────────────────────────────
  results.push(check("pnpm available", () => {
    try {
      const v = execSync("pnpm --version", { stdio: "pipe" }).toString().trim();
      return { status: "pass", detail: `v${v}` };
    } catch {
      return { status: "warn", detail: "not found — install with: npm i -g pnpm" };
    }
  }));

  // ── Git Available ──────────────────────────────────────────────────────────
  results.push(check("git available", () => {
    try {
      const v = execSync("git --version", { stdio: "pipe" }).toString().trim();
      return { status: "pass", detail: v };
    } catch {
      return { status: "warn", detail: "not found — some features require git" };
    }
  }));

  // ── AI Provider API Keys ───────────────────────────────────────────────────
  const providers: { name: string; envVar: string }[] = [
    { name: "Gemini (Google AI)", envVar: "GEMINI_API_KEY" },
    { name: "Groq", envVar: "GROQ_API_KEY" },
    { name: "OpenRouter", envVar: "OPENROUTER_API_KEY" },
    { name: "Anthropic", envVar: "ANTHROPIC_API_KEY" },
    { name: "OpenAI", envVar: "OPENAI_API_KEY" },
  ];

  let providerCount = 0;
  for (const p of providers) {
    const key = process.env[p.envVar];
    if (key && key.length > 8) {
      providerCount++;
      results.push(check(`${p.name} API key`, () => ({
        status: "pass",
        detail: `${p.envVar}=${key.slice(0, 6)}${"*".repeat(6)}`
      })));
    } else {
      results.push(check(`${p.name} API key`, () => ({
        status: key ? "warn" : "warn",
        detail: `${p.envVar} not set`
      })));
    }
  }

  // ── Generated Output Directory ─────────────────────────────────────────────
  results.push(check("generated/project directory", () => {
    const exists = existsSync(join(process.cwd(), "generated", "project"));
    return exists
      ? { status: "pass", detail: "exists" }
      : { status: "warn", detail: "not yet created — run: aegis create \"<prompt>\"" };
  }));

  // ── .aegis Config Directory ────────────────────────────────────────────────
  results.push(check(".aegis config directory", () => {
    const exists = existsSync(join(process.cwd(), ".aegis"));
    return exists
      ? { status: "pass", detail: "exists" }
      : { status: "warn", detail: "not found — run from Aegis project root" };
  }));

  // ── Memory / Knowledge Graph ───────────────────────────────────────────────
  results.push(check("Knowledge Graph data", () => {
    const kgPath = join(process.cwd(), "generated", "project", ".aegis", "memory.json");
    if (existsSync(kgPath)) {
      const size = readFileSync(kgPath, "utf8").length;
      return { status: "pass", detail: `memory.json (${Math.round(size / 1024)}KB)` };
    }
    return { status: "warn", detail: "no memory graph yet — will be created on first generate" };
  }));

  // ── Print Results ──────────────────────────────────────────────────────────
  console.log("  Check                                Status");
  console.log("  " + "─".repeat(58));
  for (const r of results) printResult(r);
  console.log();

  const passes = results.filter(r => r.status === "pass").length;
  const fails = results.filter(r => r.status === "fail").length;
  const warns = results.filter(r => r.status === "warn").length;

  if (providerCount === 0) {
    console.log("\x1b[31m  ✗ CRITICAL: No AI provider API key found.\x1b[0m");
    console.log("    At least one of the following must be set:");
    for (const p of providers) {
      console.log(`      set ${p.envVar}=your_key_here`);
    }
    console.log();
  }

  if (fails > 0) {
    console.log(`\x1b[31m  Doctor: ${fails} critical issue(s) found. Fix them before generating.\x1b[0m\n`);
  } else if (warns > 0) {
    console.log(`\x1b[33m  Doctor: ${passes} checks passed, ${warns} warning(s). Aegis is functional.\x1b[0m\n`);
  } else {
    console.log(`\x1b[32m  Doctor: All ${passes} checks passed. Aegis is ready to generate! 🚀\x1b[0m\n`);
  }
}
