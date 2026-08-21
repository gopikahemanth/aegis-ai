/**
 * AST Cache Lock — Aegis V2.3 Project 2 Phase 1
 *
 * Provides exclusive filesystem locking for .aegis/cache/ast/.lock with timeout
 * and safe fallback to in-memory processing on collision.
 */

import { mkdirSync, rmdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

export class AstCacheLock {
  private readonly lockDir: string;
  private readonly timeoutMs: number;
  private isLocked: boolean = false;

  constructor(cacheRoot: string, timeoutMs: number = 5000) {
    this.lockDir = join(cacheRoot, ".lock");
    this.timeoutMs = timeoutMs;
  }

  /**
   * Attempts to acquire exclusive directory lock with timeout.
   * Returns true if acquired, false if timed out.
   */
  public acquire(): boolean {
    const startTime = Date.now();
    while (Date.now() - startTime < this.timeoutMs) {
      try {
        mkdirSync(this.lockDir, { recursive: false });
        this.isLocked = true;
        return true;
      } catch (err: any) {
        if (err.code === "EEXIST") {
          // Check for stale lock older than 15 seconds
          try {
            const stat = statSync(this.lockDir);
            if (Date.now() - stat.mtimeMs > 15000) {
              rmdirSync(this.lockDir);
              continue;
            }
          } catch {
            // Stat or rmdir failed; continue waiting
          }

          // Lock held by another process; sleep briefly
          this.sleepSync(50);
        } else {
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Releases the lock.
   */
  public release(): void {
    if (this.isLocked && existsSync(this.lockDir)) {
      try {
        rmdirSync(this.lockDir);
      } catch {}
      this.isLocked = false;
    }
  }

  private sleepSync(ms: number): void {
    const end = Date.now() + ms;
    while (Date.now() < end) {}
  }
}
