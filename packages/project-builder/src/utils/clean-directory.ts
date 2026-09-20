import { existsSync, rmSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Asserts that the target directory is empty or does not exist for a fresh generation.
 * If the target contains files and isIncremental is not true, throws GENERATION_TARGET_NOT_EMPTY.
 */
export function assertCleanTargetDirectory(targetPath: string, isIncremental?: boolean): void {
  if (!existsSync(targetPath)) return;
  const entries = readdirSync(targetPath).filter((e) => e !== ".git" && e !== ".DS_Store");
  if (entries.length > 0 && !isIncremental) {
    throw new Error(
      `GENERATION_TARGET_NOT_EMPTY: Target directory "${targetPath}" contains an existing project (${entries.length} files/folders). ` +
      `Clean generation requires an empty or non-existent directory to prevent cross-domain contamination. ` +
      `Pass --incremental to explicitly evolve an existing project, or specify a clean directory via --output <dir>.`
    );
  }
}

/**
 * Safely cleans a target directory by killing any processes locking files inside it
 * (e.g., node, vite, prisma) and executing fallback OS commands if standard rmSync fails.
 */
export function cleanDirectory(targetPath: string): void {
  if (!existsSync(targetPath)) return;

  if (process.platform === "win32") {
    try {
      const myPid = process.pid;
      const myPpid = process.ppid;
      // Terminate only orphan dev servers locking port 5173, never the generator itself
      const psCommand = `powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne ${myPid} -and $_.ProcessId -ne ${myPpid} -and ($_.CommandLine -like '*vite*5173*' -or $_.CommandLine -like '*--port 5173*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`;
      execSync(psCommand, { stdio: "ignore" });
    } catch {
      /* ignore if process termination fails */
    }
  }

  try {
    rmSync(targetPath, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  } catch (err: any) {
    if (process.platform === "win32") {
      try {
        execSync(`cmd /c rmdir /s /q "${targetPath}"`, { stdio: "ignore" });
      } catch {
        try {
          execSync(`powershell -Command "Remove-Item -Recurse -Force '${targetPath}' -ErrorAction SilentlyContinue"`, { stdio: "ignore" });
        } catch {
          console.warn(`[CleanDirectory] Warning: Target directory clean fallback error: ${err.message}`);
        }
      }
    } else {
      console.warn(`[CleanDirectory] Warning: Target directory clean error: ${err.message}`);
    }
  }
}
