import { existsSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

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
