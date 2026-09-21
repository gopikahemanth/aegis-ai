import { spawn, execSync, ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import http from "node:http";

export interface AppServerInfo {
  framework: string;
  startCommand: string;
  port: number;
  url: string;
  ready: boolean;
}

export class AppServerRunner {
  private static process: ChildProcess | null = null;
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

    if (process.platform === "win32") {
      try {
        const { execSync } = await import("child_process");
        const myPid = process.pid;
        const myPpid = process.ppid;
        execSync(`powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne ${myPid} -and $_.ProcessId -ne ${myPpid} -and ($_.CommandLine -like '*vite*${port}*' -or $_.CommandLine -like '*--port ${port}*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: "ignore" });
      } catch {}
    }

    const localViteBin = join(absDir, "node_modules", "vite", "bin", "vite.js");
    if (existsSync(localViteBin)) {
      this.process = spawn(process.execPath, [localViteBin, "--port", String(port)], {
        cwd: absDir,
        shell: false,
        stdio: "pipe",
        env: { ...process.env, PORT: String(port) },
      });
    } else {
      const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
      this.process = spawn(npxCmd, ["vite", "--port", String(port)], {
        cwd: absDir,
        shell: false,
        stdio: "pipe",
        env: { ...process.env, PORT: String(port) },
      });
    }

    let isReady = false;
    const startTime = Date.now();
    const timeoutMs = 20_000;

    while (Date.now() - startTime < timeoutMs) {
      isReady = await this.checkHealth(port);
      if (isReady) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (isReady) {
      console.log(`[AppServerRunner] ✓ Server is live and ready at ${url}`);
    } else {
      console.warn(`[AppServerRunner] ⚠️ Server health check timed out after 20s. Proceeding with browser validation on ${url}...`);
    }

    return {
      framework: "React-Vite",
      startCommand,
      port,
      url,
      ready: isReady,
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
  }

  private static checkHealth(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}
