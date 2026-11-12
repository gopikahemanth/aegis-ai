import { spawn, execSync, ChildProcess } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import http from "node:http";
import { BackendCompilationGate } from "../build/backend-compilation-gate.js";

export interface AppServerInfo {
  framework: string;
  startCommand: string;
  port: number;
  url: string;
  ready: boolean;
  backendPort?: number;
  backendUrl?: string;
}

export class AppServerRunner {
  private static process: ChildProcess | null = null;
  private static backendProcess: ChildProcess | null = null;
  private static activePort: number = 5173;

  public static async startServer(outputDirectory: string): Promise<AppServerInfo> {
    const absDir = resolve(outputDirectory);
    const pkgPath = join(absDir, "package.json");
    let startCommand = "pnpm run dev";
    let port = 5173;

    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (pkg.scripts?.dev) {
          startCommand = "pnpm run dev";
          const match = pkg.scripts.dev.match(/--port\s+(\d+)/);
          if (match) port = parseInt(match[1], 10);
        } else if (pkg.scripts?.start) {
          startCommand = "pnpm start";
        }
      } catch {}
    }

    const viteConfigPath = join(absDir, "vite.config.ts");
    if (existsSync(viteConfigPath)) {
      try {
        const content = readFileSync(viteConfigPath, "utf8");
        const match = content.match(/port:\s*(\d+)/);
        if (match) port = parseInt(match[1], 10);
      } catch {}
    }

    this.activePort = port;
    const url = `http://localhost:${port}`;

    console.log(`[AppServerRunner] 🚀 Starting application server...`);
    console.log(`  Command: ${startCommand}`);
    console.log(`  Target Port: ${port}`);
    console.log(`  Target URL: ${url}`);

    // Parse .env if present in project directory so backend and server have access to DATABASE_URL etc.
    const projectEnv: Record<string, string> = {};
    const dotEnvPath = join(absDir, ".env");
    if (existsSync(dotEnvPath)) {
      try {
        const raw = readFileSync(dotEnvPath, "utf8");
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const k = trimmed.substring(0, eqIdx).trim();
              let v = trimmed.substring(eqIdx + 1).trim();
              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
              }
              projectEnv[k] = v;
            }
          }
        }
      } catch {}
    }

    if (process.platform === "win32") {
      try {
        const { execSync } = await import("child_process");
        const myPid = process.pid;
        const myPpid = process.ppid;
        execSync(`powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne ${myPid} -and $_.ProcessId -ne ${myPpid} -and ($_.CommandLine -like '*vite*${port}*' -or $_.CommandLine -like '*--port ${port}*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: "ignore" });
      } catch {}
    }

    const isWindows = process.platform === "win32";
    const localViteBin = join(absDir, "node_modules", "vite", "bin", "vite.js");
    if (existsSync(localViteBin)) {
      this.process = spawn(process.execPath, [localViteBin, "--port", String(port)], {
        cwd: absDir,
        shell: false,
        stdio: "ignore",
        env: { ...process.env, ...projectEnv, PORT: String(port) },
      });
    } else {
      const npxCmd = isWindows ? "npx.cmd" : "npx";
      this.process = spawn(npxCmd, ["vite", "--port", String(port)], {
        cwd: absDir,
        shell: isWindows,
        stdio: "ignore",
        env: { ...process.env, ...projectEnv, PORT: String(port) },
      });
    }

    const serverIndex = join(absDir, "server", "index.ts");
    const prismaSchema = join(absDir, "prisma", "schema.prisma");
    const prismaStatusFile = join(absDir, ".aegis", "prisma-status.json");

    let prismaBlockedReason: string | null = null;
    if (existsSync(prismaSchema) && existsSync(prismaStatusFile)) {
      try {
        const pStatus = JSON.parse(readFileSync(prismaStatusFile, "utf8"));
        const clientExists = existsSync(join(absDir, "node_modules", ".prisma", "client")) ||
                             existsSync(join(absDir, "node_modules", "@prisma", "client", "default.js")) ||
                             existsSync(join(absDir, "node_modules", "@prisma", "client", "index.js"));
        if ((pStatus.clientGenerated === false || pStatus.valid === false) && !clientExists) {
          prismaBlockedReason = pStatus.error || "Prisma schema validation or client generation failed.";
        }
      } catch {}
    }

    if (prismaBlockedReason) {
      console.error(`[AppServerRunner] ❌ PRISMA_CLIENT_BLOCKED: Backend requires generated Prisma client, but generation failed:\n${prismaBlockedReason}`);
      console.error(`[AppServerRunner] 🛑 Aborting backend startup to prevent crash loop.`);
    } else if (existsSync(serverIndex)) {
      // Pre-flight check: verify route and controller files have balanced delimiters and correct imports before launching tsx
      const targetDirs = [
        join(absDir, "server"),
        join(absDir, "server", "routes"),
        join(absDir, "server", "controllers"),
        join(absDir, "server", "services"),
        join(absDir, "server", "middleware"),
      ].filter(existsSync);
      for (const tDir of targetDirs) {
        try {
          const files = readdirSync(tDir);
          for (const rf of files) {
            if (rf.endsWith(".ts") || rf.endsWith(".js")) {
              const rfp = join(tDir, rf);
              let rfc = readFileSync(rfp, "utf8");
              let fileModified = false;

              // Harmonize bcrypt imports to bcryptjs (pure-JS standard avoiding missing native bindings)
              if (rfc.includes("'bcrypt'") || rfc.includes('"bcrypt"')) {
                console.warn(`[AppServerRunner] ⚠️ Harmonizing bcrypt -> bcryptjs in ${rf}...`);
                rfc = rfc.replace(/(['"])bcrypt\1/g, "$1bcryptjs$1");
                fileModified = true;
              }

              // Auto-repair accidental assignment injection in auth middleware (e.g. const decoded =\n  if (token === ...))
              if (/const\s+([a-zA-Z0-9_$]+)\s*=\s*(\s*if\s*\([\s\S]*?\}\s*)(?=jwt\.verify)/.test(rfc)) {
                console.warn(`[AppServerRunner] ⚠️ Auto-repairing corrupted auth middleware assignment in ${rf}...`);
                rfc = rfc.replace(
                  /const\s+([a-zA-Z0-9_$]+)\s*=\s*(\s*if\s*\([\s\S]*?\}\s*)(?=jwt\.verify)/,
                  `$2\n  const $1 = `
                );
                fileModified = true;
              }

              // Auto-repair any malformed trailing delimiters like ";\n  });\n  }\n});" anywhere in the file
              if (/;\s*\}\);\s*\}\s*\}\);/.test(rfc)) {
                console.warn(`[AppServerRunner] ⚠️ Detected malformed catch block delimiter in ${rf}. Auto-repairing...`);
                rfc = rfc.replace(/;\s*\}\);\s*\}\s*\}\);/g, ";\n  }\n});");
                fileModified = true;
              }
              const ob = (rfc.match(/\{/g) || []).length;
              const cb = (rfc.match(/\}/g) || []).length;
              const op = (rfc.match(/\(/g) || []).length;
              const cp = (rfc.match(/\)/g) || []).length;
              if (ob !== cb || op !== cp) {
                console.warn(`[AppServerRunner] ⚠️ Detected unbalanced delimiters in ${rf} ({ ${ob} vs ${cb}, ( ${op} vs ${cp} ). Auto-repairing...`);
                rfc = rfc.replace(/\}\);\s*\}\s*\}\);/g, "  }\n});");
                rfc = rfc.replace(/\}\);\s*\}\s*$/gm, "});");
                fileModified = true;
              }

              if (fileModified) {
                writeFileSync(rfp, rfc, "utf8");
              }
            }
          }
        } catch {}
      }

      // Independent Backend Compilation Gate: statically verify backend code before spawning
      const backendComp = BackendCompilationGate.verify(absDir);
      if (!backendComp.passed) {
        console.error(`[AppServerRunner] ❌ BACKEND_COMPILATION_BLOCKED: Backend failed compilation:\n${backendComp.summary}`);
        prismaBlockedReason = backendComp.summary;
      } else {
        const backendEnv = { ...process.env, ...projectEnv, PORT: "5000" };
        const localTsxBin = join(absDir, "node_modules", "tsx", "dist", "cli.mjs");
        if (existsSync(localTsxBin)) {
          this.backendProcess = spawn(process.execPath, [localTsxBin, "server/index.ts"], {
            cwd: absDir,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
            env: backendEnv,
          });
        } else {
          const cmd = isWindows ? "npx.cmd" : "npx";
          this.backendProcess = spawn(cmd, ["tsx", "server/index.ts"], {
            cwd: absDir,
            shell: isWindows,
            stdio: ["ignore", "pipe", "pipe"],
            env: backendEnv,
          });
        }
        this.backendProcess.stderr?.on("data", (data) => {
          const line = data.toString().trim();
          if (line) console.error(`[AppServerRunner:Backend] ⚠️ ${line}`);
        });
        this.backendProcess.stdout?.on("data", (data) => {
          const line = data.toString().trim();
          if (line && (line.includes("Server") || line.includes("running") || line.includes("Listening"))) {
            console.log(`[AppServerRunner:Backend] ✓ ${line}`);
          }
        });
        this.backendProcess.on("exit", (code) => {
          if (code !== 0 && code !== null) {
            console.error(`[AppServerRunner:Backend] ❌ Backend process exited with code ${code}`);
          }
        });
        console.log(`[AppServerRunner] 🚀 Express backend process spawned on port 5000.`);
      }
    }

    let isReady = false;
    const startTime = Date.now();
    const timeoutMs = 20_000;

    while (Date.now() - startTime < timeoutMs) {
      if (prismaBlockedReason) {
        break;
      }
      const frontendHealthy = await this.checkHealth(port, ["/"]);
      const backendHealthy = existsSync(serverIndex) && !prismaBlockedReason ? await this.checkHealth(5000, ["/api/health", "/"]) : true;
      if (frontendHealthy && backendHealthy) {
        isReady = true;
        break;
      }
      if (this.backendProcess && this.backendProcess.exitCode !== null) {
        console.error(`[AppServerRunner] ❌ Express backend failed to start (exit code: ${this.backendProcess.exitCode}).`);
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (isReady) {
      console.log(`[AppServerRunner] ✓ Server is live and ready at ${url}`);
    } else {
      console.warn(`[AppServerRunner] ⚠️ Server readiness verification failed on ${url}.`);
    }

    const hasBackend = existsSync(serverIndex);
    return {
      framework: "React-Vite",
      startCommand,
      port,
      url,
      ready: isReady,
      backendPort: hasBackend ? 5000 : undefined,
      backendUrl: hasBackend ? "http://localhost:5000" : undefined,
    };
  }

  public static stopServer(): void {
    if (this.process) {
      try {
        if (process.platform === "win32" && this.process.pid) {
          try {
            execSync(`taskkill /pid ${this.process.pid} /T /F`, { stdio: "ignore" });
          } catch {}
        }
        this.process.kill();
        console.log(`[AppServerRunner] 🛑 Stopped dev server process.`);
      } catch {}
      this.process = null;
    }
    if (this.backendProcess) {
      try {
        if (process.platform === "win32" && this.backendProcess.pid) {
          try {
            execSync(`taskkill /pid ${this.backendProcess.pid} /T /F`, { stdio: "ignore" });
          } catch {}
        }
        this.backendProcess.kill();
        console.log(`[AppServerRunner] 🛑 Stopped backend server process.`);
      } catch {}
      this.backendProcess = null;
    }
  }

  private static checkHealth(port: number, paths: string[] = ["/", "/api/health"]): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      const tryFetch = (pathIdx: number, useLoopbackIp: boolean) => {
        if (resolved) return;
        if (pathIdx >= paths.length) {
          if (!useLoopbackIp) {
            tryFetch(0, true);
          } else {
            resolve(false);
          }
          return;
        }
        const host = useLoopbackIp ? "127.0.0.1" : "localhost";
        const path = paths[pathIdx];
        const req = http.get(`http://${host}:${port}${path}`, (res) => {
          if (res.statusCode !== undefined && res.statusCode < 500) {
            resolved = true;
            resolve(true);
          } else {
            tryFetch(pathIdx + 1, useLoopbackIp);
          }
        });
        req.on("error", () => {
          tryFetch(pathIdx + 1, useLoopbackIp);
        });
        req.setTimeout(1000, () => {
          req.destroy();
          tryFetch(pathIdx + 1, useLoopbackIp);
        });
      };
      tryFetch(0, false);
    });
  }
}
