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
      const netstatOut = execSync("netstat -ano -p tcp", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      for (const line of netstatOut.split(/\r?\n/)) {
        if (line.includes(":5173") && line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(Number(pid)) && Number(pid) !== process.pid && Number(pid) !== process.ppid) {
            try { execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" }); } catch {}
          }
        }
      }
    } catch {}
    try {
      const psScript = `
        $currentPid = ${process.pid};
        $parentPid = ${process.ppid};
        Get-Process node -ErrorAction SilentlyContinue | Where-Object {
          $_.Id -ne $currentPid -and $_.Id -ne $parentPid
        } | ForEach-Object {
          try {
            $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue
            $normalizedTarget = '${targetPath.replace(/'/g, "''")}';
            if ($proc.CommandLine -and ($proc.CommandLine -like "*vite*" -or $proc.CommandLine -like "*5173*" -or $proc.CommandLine -like "*$normalizedTarget*")) {
              Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
          } catch {}
        }
      `;
      const b64 = Buffer.from(psScript, "utf16le").toString("base64");
      execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${b64}`, { stdio: "ignore" });
    } catch {}
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
