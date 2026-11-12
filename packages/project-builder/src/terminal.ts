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
        npm_config_confirm_modules_purge: "false",
        npm_config_verify_deps_before_run: "false",
        npm_config_only_built_dependencies: "*",
        npm_config_ignore_scripts: "false",
      };

      // ── Cross-Platform Shell Configuration ────────────────────────────────
      // On Windows: use shell:true with cmd.exe explicitly resolved to avoid
      // ENOENT when cmd.exe is not on the default PATH. Using shell:true on
      // Windows causes Node to prepend "cmd.exe /d /s /c" automatically.
      // On Linux/macOS: use shell:false with the executable directly for
      // maximum compatibility and no shell quoting surprises.
      const isWindows = process.platform === "win32";
      const spawnOptions: Parameters<typeof spawn>[2] = {
        cwd,
        env,
        shell: isWindows,  // cmd.exe handles pnpm.cmd / npm.cmd on Windows
        stdio: ["ignore", "pipe", "pipe"],
      };

      // On Windows, resolve .cmd/.ps1 wrappers explicitly when shell is not
      // used. Since shell:true is set above, this is a safety comment only.
      // If we ever switch back to shell:false on Windows, the command would
      // need to be `${command}.cmd` or use the full path.

      const child = spawn(command, args, spawnOptions);

      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try {
            if (isWindows && child.pid) {
              // Windows: use taskkill to ensure child processes are also killed
              const { execSync } = require("node:child_process");
              try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" }); } catch {}
            } else {
              child.kill("SIGKILL");
            }
          } catch {}
          resolve({
            stdout,
            stderr: stderr + `\n[TerminalRunner] Command timed out after ${timeoutMs}ms`,
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

      child.on("error", (err: NodeJS.ErrnoException) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);

          // ── ENOENT Recovery ───────────────────────────────────────────────
          // On Windows, some environments don't expose the .cmd extension.
          // Try to re-run with the .cmd suffix appended.
          if (isWindows && err.code === "ENOENT" && !command.endsWith(".cmd")) {
            const cmdCommand = `${command}.cmd`;
            console.warn(`[TerminalRunner] ENOENT for "${command}" on Windows — retrying with "${cmdCommand}"`);
            const fallback = new TerminalRunner();
            fallback.run(cmdCommand, args, cwd, timeoutMs).then(resolve).catch(() => {
              resolve({
                stdout: "",
                stderr: `[TerminalRunner] ENOENT: Command not found — "${command}" and "${cmdCommand}" on Windows. Ensure the package manager is installed and on PATH.`,
                exitCode: 1,
              });
            });
            return;
          }

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
