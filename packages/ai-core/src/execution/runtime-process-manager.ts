/**
 * RuntimeProcessManager
 *
 * Manages runtime processes (backend HTTP servers, frontend dev servers, test runners)
 * with dynamic port allocation, readiness polling, exit code capture, startup failure classification,
 * and robust cross-platform process cleanup.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import http from "node:http";

export type ProcessStartupFailureCategory =
  | "CODE_FAILURE"
  | "BUILD_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "CONFIGURATION_FAILURE"
  | "ENVIRONMENT_FAILURE"
  | "DATABASE_FAILURE"
  | "PORT_FAILURE"
  | "RUNTIME_FAILURE";

export interface ProcessInstance {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  port: number;
  pid?: number;
  startTime: number;
  ready: boolean;
  exitCode: number | null;
  stdout: string[];
  stderr: string[];
  logs: string[];
  childProcess?: ChildProcess;
}

export interface ProcessStartOptions {
  cwd: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  port?: number;
  healthEndpoint?: string;
  readinessTimeoutMs?: number;
}

export class RuntimeProcessManager {
  private static activeProcesses: Map<string, ProcessInstance> = new Map();

  /**
   * Dynamically find an available TCP port.
   */
  public static async allocateFreePort(preferredPort?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.unref();

      server.on("error", (err: any) => {
        if (preferredPort && err.code === "EADDRINUSE") {
          // Fall back to random free port
          RuntimeProcessManager.allocateFreePort().then(resolve, reject);
        } else {
          reject(err);
        }
      });

      server.listen(preferredPort || 0, () => {
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : preferredPort || 0;
        server.close(() => resolve(port));
      });
    });
  }

  /**
   * Start a runtime process with health readiness polling.
   */
  public static async startProcess(
    id: string,
    options: ProcessStartOptions
  ): Promise<{ success: boolean; instance: ProcessInstance; error?: string; failureCategory?: ProcessStartupFailureCategory }> {
    // 1. Ensure no existing process with this ID
    await this.stopProcess(id);

    const port = options.port || (await this.allocateFreePort());
    const timeoutMs = options.readinessTimeoutMs || 15_000;
    const stdout: string[] = [];
    const stderr: string[] = [];
    const logs: string[] = [];

    const instance: ProcessInstance = {
      id,
      command: options.command,
      args: options.args || [],
      cwd: options.cwd,
      port,
      startTime: Date.now(),
      ready: false,
      exitCode: null,
      stdout,
      stderr,
      logs,
    };

    try {
      const child = spawn(options.command, options.args || [], {
        cwd: options.cwd,
        shell: true,
        stdio: "pipe",
        env: {
          ...process.env,
          PORT: String(port),
          NODE_ENV: "test",
          ...(options.env || {}),
        },
      });

      instance.pid = child.pid;
      instance.childProcess = child;

      child.stdout?.on("data", (data) => {
        const text = data.toString();
        stdout.push(text);
        logs.push(`[STDOUT] ${text.trim()}`);
      });

      child.stderr?.on("data", (data) => {
        const text = data.toString();
        stderr.push(text);
        logs.push(`[STDERR] ${text.trim()}`);
      });

      child.on("exit", (code) => {
        instance.exitCode = code;
        instance.ready = false;
        logs.push(`[EXIT] Process exited with code ${code}`);
      });

      this.activeProcesses.set(id, instance);

      // Poll readiness via HTTP health endpoint or TCP socket
      const isReady = await this.pollReadiness(port, options.healthEndpoint, timeoutMs);
      instance.ready = isReady;

      if (!isReady) {
        const failureCategory = this.classifyStartupFailure(stdout.join("\n"), stderr.join("\n"));
        await this.stopProcess(id);
        return {
          success: false,
          instance,
          error: `STARTUP_TIMEOUT: Process "${id}" failed to become ready on port ${port} within ${timeoutMs}ms.`,
          failureCategory,
        };
      }

      return { success: true, instance };
    } catch (err: any) {
      instance.ready = false;
      const failureCategory = this.classifyStartupFailure("", err.message);
      return {
        success: false,
        instance,
        error: err.message,
        failureCategory,
      };
    }
  }

  /**
   * Poll for HTTP/TCP readiness without arbitrary fixed sleep.
   */
  private static async pollReadiness(port: number, healthEndpoint: string = "/", timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const isHttpReady = await new Promise<boolean>((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}${healthEndpoint.startsWith("/") ? "" : "/"}${healthEndpoint}`, { timeout: 1000 }, (res) => {
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => {
          req.destroy();
          resolve(false);
        });
      });

      if (isHttpReady) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }

  /**
   * Classify startup failures based on stdout/stderr output.
   */
  public static classifyStartupFailure(stdout: string, stderr: string): ProcessStartupFailureCategory {
    const combined = (stdout + " " + stderr).toLowerCase();

    if (combined.includes("eaddrinuse") || combined.includes("port already in use")) {
      return "PORT_FAILURE";
    }
    if (combined.includes("database") || combined.includes("connection refused") || combined.includes("p1001") || combined.includes("can't reach database")) {
      return "DATABASE_FAILURE";
    }
    if (combined.includes("cannot find module") || combined.includes("module_not_found") || combined.includes("err_module_not_found")) {
      return "DEPENDENCY_FAILURE";
    }
    if (combined.includes("syntaxerror") || combined.includes("unexpected token") || combined.includes("typeerror")) {
      return "CODE_FAILURE";
    }
    if (combined.includes("tsc") || combined.includes("build error") || combined.includes("compilation error")) {
      return "BUILD_FAILURE";
    }
    if (combined.includes("missing env") || combined.includes("invalid url") || combined.includes("config")) {
      return "CONFIGURATION_FAILURE";
    }
    if (combined.includes("enoent") || combined.includes("permission denied") || combined.includes("econnrefused")) {
      return "ENVIRONMENT_FAILURE";
    }
    return "RUNTIME_FAILURE";
  }

  /**
   * Stop a single active process cleanly.
   */
  public static async stopProcess(id: string): Promise<boolean> {
    const instance = this.activeProcesses.get(id);
    if (!instance) return false;

    if (instance.childProcess && !instance.childProcess.killed) {
      try {
        if (process.platform === "win32" && instance.pid) {
          const { execSync } = await import("node:child_process");
          try {
            execSync(`taskkill /PID ${instance.pid} /T /F`, { stdio: "ignore" });
          } catch {}
        } else {
          instance.childProcess.kill("SIGTERM");
        }
      } catch {}
    }

    instance.ready = false;
    this.activeProcesses.delete(id);
    return true;
  }

  /**
   * Stop all managed processes.
   */
  public static async stopAll(): Promise<void> {
    const keys = Array.from(this.activeProcesses.keys());
    for (const key of keys) {
      await this.stopProcess(key);
    }
  }

  public static getProcess(id: string): ProcessInstance | undefined {
    return this.activeProcesses.get(id);
  }

  public static getAllProcesses(): ProcessInstance[] {
    return Array.from(this.activeProcesses.values());
  }
}
