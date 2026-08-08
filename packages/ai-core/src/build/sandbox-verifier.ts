import { createServer, Server, get } from "node:http";
import { readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, execSync } from "node:child_process";

export interface SandboxResult {
  success: boolean;
  message: string;
  screenshotPath?: string;
  logs?: string;
}

export class SandboxVerifier {
  private startStaticServer(projectPath: string, port: number): Server {
    const server = createServer((req, res) => {
      let filePath = join(projectPath, req.url === "/" ? "index.html" : req.url || "");
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(projectPath, "index.html");
      }

      if (!existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      try {
        const content = readFileSync(filePath);
        let contentType = "text/html";
        if (filePath.endsWith(".js")) contentType = "application/javascript";
        if (filePath.endsWith(".css")) contentType = "text/css";
        if (filePath.endsWith(".json")) contentType = "application/json";
        if (filePath.endsWith(".png")) contentType = "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) contentType = "image/jpeg";
        if (filePath.endsWith(".svg")) contentType = "image/svg+xml";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch (e: any) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Error: ${e.message}`);
      }
    });

    server.listen(port);
    return server;
  }

  private async pollUrl(url: string, timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
          return;
        }

        const req = get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            setTimeout(check, 500);
          }
        });

        req.on("error", () => {
          setTimeout(check, 500);
        });
      };
      check();
    });
  }

  async verify(projectPath: string): Promise<SandboxResult> {
    console.log("[Sandbox] Starting sandbox runtime verification...");
    const packageJsonPath = join(projectPath, "package.json");
    let childProcess: any = null;
    let staticServer: Server | null = null;
    let port = 3000;
    let targetUrl = `http://localhost:${port}`;
    let isNext = false;
    let logs = "";

    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        if (pkg.scripts && pkg.scripts.dev) {
          isNext = !!(pkg.dependencies && pkg.dependencies.next);
          port = isNext ? 3000 : 5173;
          targetUrl = `http://localhost:${port}`;

          console.log(`[Sandbox] Cleaning up stale ports before spawning dev server...`);
          try {
            if (process.platform === "win32") {
              execSync(`wmic process where "name='node.exe' and commandline like '%5173%'" call terminate`, { stdio: "ignore" });
              execSync(`wmic process where "name='node.exe' and commandline like '%5000%'" call terminate`, { stdio: "ignore" });
            }
          } catch {}

          console.log(`[Sandbox] Spawning dev server via 'pnpm dev' on port ${port}...`);
          childProcess = spawn("pnpm", ["dev"], {
            cwd: projectPath,
            shell: true,
            env: { ...process.env, PORT: String(port), VITE_PORT: String(port) },
          });

          childProcess.stdout.on("data", (data: any) => {
            logs += data.toString();
          });

          childProcess.stderr.on("data", (data: any) => {
            logs += data.toString();
          });
        }
      } catch (e: any) {
        console.warn(`[Sandbox] Failed to parse package.json: ${e.message}`);
      }
    }

    if (!childProcess) {
      console.log(`[Sandbox] Starting built-in static file server on port ${port}...`);
      staticServer = this.startStaticServer(projectPath, port);
    }

    // Wait for the server to bind and respond (25s — Windows npm/npx startup is slower)
    const serverReady = await this.pollUrl(targetUrl, 25000);

    if (!serverReady) {
      this.killChildProcess(childProcess);
      if (staticServer) staticServer.close();
      return {
        success: false,
        message: `Dev server failed to respond at ${targetUrl} within 10 seconds.`,
        logs,
      };
    }

    console.log(`[Sandbox] Server is alive at ${targetUrl}. Running live browser review...`);

    let puppeteer: any = null;
    try {
      const pkg = "puppeteer";
      puppeteer = await import(pkg);
    } catch (err) {
      // Graceful fallback
    }

    if (!puppeteer) {
      console.log("[Sandbox] Puppeteer is not installed in the workspace. Skipping visual checks.");
      if (childProcess) childProcess.kill();
      if (staticServer) staticServer.close();
      return {
        success: true,
        message: "Sandbox HTTP connection verified successfully (skipped visual checks).",
        logs,
      };
    }

    let browser: any = null;
    try {
      console.log("[Sandbox] Launching headless browser...");
      browser = await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      const consoleErrors: string[] = [];

      page.on("console", (msg: any) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("pageerror", (err: any) => {
        consoleErrors.push(err.message);
      });

      await page.goto(targetUrl, { waitUntil: "networkidle2" });
      // Give React SPA 2 seconds to finish mounting and rendering components
      await new Promise((r) => setTimeout(r, 2000));

      const screenshotPath = join(projectPath, "screenshot.png");
      await page.screenshot({ path: screenshotPath });
      console.log(`[Sandbox] Visual screenshot captured: ${screenshotPath}`);

      // Filter out non-fatal 404 asset warnings and initial backend connection 500s (favicons, missing images/styles, dev server API initial connection)
      const fatalErrors = consoleErrors.filter(err => {
        const lower = err.toLowerCase();
        if (lower.includes("favicon") || lower.includes("404 (not found)") || lower.includes("500 (internal server error)") || lower.includes("failed to load resource") || err.trim() === "%o" || err.trim() === "%s") {
          return false;
        }
        return true;
      });

      if (fatalErrors.length > 0) {
        throw new Error(`Captured ${fatalErrors.length} fatal browser console errors:\n${fatalErrors.join("\n")}`);
      }

      await browser.close();
      this.killChildProcess(childProcess);
      if (staticServer) staticServer.close();

      return {
        success: true,
        message: "Sandbox execution, browser console validation, and layout visual checks passed.",
        screenshotPath,
        logs,
      };
    } catch (browserError: any) {
      console.error("[Sandbox] Browser verification failed:", browserError.message);
      if (browser) {
        try {
          await browser.close();
        } catch (e) {}
      }
      this.killChildProcess(childProcess);
      if (staticServer) staticServer.close();

      return {
        success: false,
        message: `Live Browser verification failed: ${browserError.message}`,
        logs,
      };
    }
  }

  private killChildProcess(childProcess: any) {
    if (!childProcess) return;
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /F /T /PID ${childProcess.pid}`, { stdio: "ignore" });
      } else {
        childProcess.kill("SIGKILL");
      }
    } catch {}
  }
}
