import { spawn, execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import http from "node:http";

const ROOT_DIR = resolve("c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai");
const ARTIFACT_DIR = "C:/Users/vishn/.gemini/antigravity-ide/brain/c314194d-355d-44dc-a2ea-ca54806e9f09";

const DOMAINS = [
  {
    id: "telemed",
    name: "Pediatric Telemedicine",
    prompt: "pediatric clinic portal with online doctor appointment booking, patient immunization records, symptom guide, and direct doctor messaging",
    outputDir: "./projects/sweep-telemed",
    port: 5201,
  },
  {
    id: "fintech",
    name: "Dividend Portfolio Tracker",
    prompt: "dividend investment portfolio tracker with asset allocation pie chart, dividend payout calendar, stock watchlist, and compound growth calculator",
    outputDir: "./projects/sweep-fintech",
    port: 5202,
  },
  {
    id: "fitness",
    name: "Fitness Program Builder",
    prompt: "personal fitness trainer platform with custom workout routine builder, video exercise library, weekly progress charts, and daily meal nutrition tracker",
    outputDir: "./projects/sweep-fitness",
    port: 5203,
  },
  {
    id: "realestate",
    name: "Commercial Office Leasing",
    prompt: "commercial office leasing directory with building amenities list, square footage filter, interactive floor plan inquiry, and tour scheduling",
    outputDir: "./projects/sweep-realestate",
    port: 5204,
  },
  {
    id: "freight",
    name: "Freight Courier Dispatch",
    prompt: "freight courier dispatch portal with shipment tracking status, delivery route manifest, driver fleet roster, and rate quote estimator",
    outputDir: "./projects/sweep-freight",
    port: 5205,
  },
  {
    id: "festival",
    name: "Summer Music Festival",
    prompt: "outdoor summer music festival guide with multi-stage schedule, artist lineup cards, festival map, and VIP ticket tier reservation",
    outputDir: "./projects/sweep-festival",
    port: 5206,
  },
  {
    id: "onboarding",
    name: "HR Employee Onboarding",
    prompt: "employee onboarding portal with new hire task checklist, company policy documents, team directory, and benefits enrollment form",
    outputDir: "./projects/sweep-onboarding",
    port: 5207,
  },
  {
    id: "edtech",
    name: "Coding Academy Platform",
    prompt: "interactive online programming academy with course curriculum catalog, lesson code playground, student quiz challenges, and completion certificates",
    outputDir: "./projects/sweep-edtech",
    port: 5208,
  }
];

async function waitForPort(port, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://localhost:${port}/`, (response) => {
          res(true);
        });
        req.on("error", rej);
        req.setTimeout(1000, () => {
          req.destroy();
          rej(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  return false;
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    console.log(`[Sweep] Running: ${command} ${args.join(" ")} in ${cwd}`);
    const proc = spawn(command, args, { cwd, shell: true, stdio: "inherit" });
    proc.on("close", (code) => {
      resolve(code);
    });
    proc.on("error", (err) => {
      console.error(`[Sweep] Error spawning ${command}:`, err);
      resolve(-1);
    });
  });
}

async function main() {
  const results = [];
  console.log(`=======================================================`);
  console.log(`🚀 STARTING 8-DOMAIN GENERALIZATION SWEEP`);
  console.log(`=======================================================\n`);

  for (let i = 0; i < DOMAINS.length; i++) {
    const d = DOMAINS[i];
    console.log(`\n-------------------------------------------------------`);
    console.log(`[${i + 1}/${DOMAINS.length}] Processing Domain: ${d.name} (${d.id})`);
    console.log(`Prompt: "${d.prompt}"`);
    console.log(`Output: ${d.outputDir}`);
    console.log(`-------------------------------------------------------`);

    const fullOutputDir = resolve(ROOT_DIR, d.outputDir);

    const startTime = Date.now();
    const createCode = await runCommand("pnpm", ["cli", "create", `"${d.prompt}"`, "--output", d.outputDir], ROOT_DIR);
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    const routesFile = join(fullOutputDir, "src", "routes.tsx");
    let routesContent = "";
    let rootComponent = "MISSING";
    let hasTabbedWorkspace = false;
    let routesCount = 0;

    if (existsSync(routesFile)) {
      routesContent = readFileSync(routesFile, "utf8");
      const rootMatch = routesContent.match(/<Route\s+path="\/"\s+element=\{<([^ /]+)\s*\/>\}/);
      if (rootMatch && rootMatch[1]) {
        rootComponent = rootMatch[1];
      }
      hasTabbedWorkspace = routesContent.includes("PrimaryWorkspace");
      const allRoutes = [...routesContent.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]);
      routesCount = allRoutes.length;
    }

    let buildStatus = "UNKNOWN";
    if (existsSync(join(fullOutputDir, "dist", "index.html"))) {
      buildStatus = "PASS";
    } else if (existsSync(fullOutputDir)) {
      const bCode = await runCommand("pnpm", ["run", "build"], fullOutputDir);
      buildStatus = bCode === 0 ? "PASS" : "FAIL";
    }

    let screenshotCaptured = false;
    const screenshotName = `sweep_${d.id}_home.png`;
    const screenshotPath = join(ARTIFACT_DIR, screenshotName);

    if (existsSync(routesFile)) {
      console.log(`[Sweep] Launching dev server on port ${d.port} for screenshot...`);
      const devProc = spawn("pnpm", ["run", "dev", "--port", String(d.port)], { cwd: fullOutputDir, shell: true });

      const ready = await waitForPort(d.port, 20000);
      if (ready) {
        console.log(`[Sweep] Server live at http://localhost:${d.port}/. Capturing screenshot...`);
        try {
          const puppeteerScript = `
            const puppeteer = require('puppeteer');
            (async () => {
              const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
              const page = await browser.newPage();
              await page.setViewport({ width: 1280, height: 800 });
              await page.goto('http://localhost:${d.port}/', { waitUntil: 'networkidle2', timeout: 15000 });
              await page.screenshot({ path: '${screenshotPath.replace(/\\/g, "/")}' });
              await browser.close();
              console.log('SCREENSHOT_OK');
            })().catch(e => { console.error(e.message); process.exit(1); });
          `;
          execSync(`pnpm --filter @aegis/ai-core exec node -e "${puppeteerScript.replace(/\n/g, " ")}"`, { cwd: ROOT_DIR, stdio: "inherit" });
          screenshotCaptured = existsSync(screenshotPath);
        } catch (e) {
          console.error(`[Sweep] Screenshot failed:`, e.message);
        }
      } else {
        console.warn(`[Sweep] Dev server failed to respond on port ${d.port}`);
      }

      try {
        if (process.platform === "win32") {
          execSync(`taskkill /pid ${devProc.pid} /T /F`, { stdio: "ignore" });
        } else {
          devProc.kill("SIGKILL");
        }
      } catch {}
    }

    const domainResult = {
      id: d.id,
      name: d.name,
      prompt: d.prompt,
      durationSec,
      exitCode: createCode,
      buildStatus,
      rootComponent,
      hasTabbedWorkspace,
      routesCount,
      screenshotCaptured,
      screenshotFile: screenshotName,
    };

    results.push(domainResult);
    console.log(`[Sweep Result ${d.id}]: Root=${rootComponent}, Build=${buildStatus}, TabbedWorkspace=${hasTabbedWorkspace}, Screenshot=${screenshotCaptured}`);
    
    writeFileSync(join(ROOT_DIR, "sweep_progress.json"), JSON.stringify(results, null, 2), "utf8");
  }

  console.log(`\n=======================================================`);
  console.log(`🏁 SWEEP COMPLETE: ${results.length} domains processed.`);
  console.log(`=======================================================`);
}

main().catch(err => {
  console.error("Fatal sweep error:", err);
  process.exit(1);
});
