import { spawn } from "node:child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class TerminalRunner {
  run(
    command: string,
    args: string[],
    cwd: string,
    timeoutMs: number = 120000,
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      let isResolved = false;
      const env = {
        ...process.env,
        CI: "true",
        CONTINUOUS_INTEGRATION: "true",
        FORCE_COLOR: "0",
      };

      const child = spawn(command, args, {
        cwd,
        env,
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try { child.kill("SIGKILL"); } catch {}
          resolve({
            stdout,
            stderr: stderr + "\n[TerminalRunner] Command timed out after 120s",
            exitCode: 124,
          });
        }
      }, timeoutMs);

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0,
          });
        }
      });

      child.on("error", (err) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr: stderr + "\n" + err.message,
            exitCode: 1,
          });
        }
      });
    });
  }
}
