import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { BrownfieldGitStatus, GitWorkingState } from "./brownfield-contract.js";

export interface GitPreflightResult {
  status: BrownfieldGitStatus;
  allowed: boolean;
  reason?: string;
  conflictingFiles?: string[];
  gitState: GitWorkingState;
}

export class BrownfieldGitGuard {
  private static runGit(cmd: string, cwd: string): string {
    try {
      return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    } catch (e: any) {
      return "";
    }
  }

  /**
   * Evaluates whether brownfield modifications can safely proceed given the current worktree state.
   */
  public static evaluatePreflight(projectRoot: string, plannedTargetFiles: string[] = []): GitPreflightResult {
    const gitDir = join(projectRoot, ".git");
    if (!existsSync(gitDir)) {
      return {
        status: "CLEAN",
        allowed: true,
        gitState: {
          isGitRepo: false,
          branch: "",
          headCommit: "",
          isClean: true,
          dirtyFiles: [],
          untrackedFiles: [],
        },
      };
    }

    const branch = this.runGit("git rev-parse --abbrev-ref HEAD", projectRoot) || "HEAD";
    const headCommit = this.runGit("git rev-parse HEAD", projectRoot) || "HEAD";
    const statusOutput = this.runGit("git status --porcelain", projectRoot);

    const dirtyFiles: string[] = [];
    const untrackedFiles: string[] = [];

    for (const rawLine of statusOutput.split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      if (!line || line.length < 3) continue;
      const code = line.slice(0, 2);
      const file = line.slice(2).trim().replace(/^"|"$/g, "").replace(/\\/g, "/");
      if (code.includes("?")) {
        untrackedFiles.push(file);
      } else {
        dirtyFiles.push(file);
      }
    }

    const gitState: GitWorkingState = {
      isGitRepo: true,
      branch,
      headCommit,
      isClean: dirtyFiles.length === 0 && untrackedFiles.length === 0,
      dirtyFiles,
      untrackedFiles,
    };

    // Check if any planned target file is already modified by the user
    const normalizedTargets = plannedTargetFiles.map(f => f.replace(/\\/g, "/").toLowerCase());
    const conflicts = dirtyFiles.filter(df => normalizedTargets.includes(df.toLowerCase()));

    if (conflicts.length > 0) {
      return {
        status: "DIRTY_TARGET_CONFLICT",
        allowed: false,
        reason: `GIT_DIRTY_TARGET: User has uncommitted modifications in target file(s): ${conflicts.join(", ")}. Please commit or stash your changes before running Aegis.`,
        conflictingFiles: conflicts,
        gitState,
      };
    }

    if (dirtyFiles.length > 0 || untrackedFiles.length > 0) {
      return {
        status: "DIRTY_SAFE",
        allowed: true,
        reason: `Working tree has uncommitted user modifications in unrelated files (${dirtyFiles.length} dirty, ${untrackedFiles.length} untracked). Staging will be strictly restricted to Aegis-touched files only.`,
        gitState,
      };
    }

    return {
      status: "CLEAN",
      allowed: true,
      gitState,
    };
  }

  /**
   * Stages ONLY the explicitly touched files and commits them.
   * NEVER runs `git add .` or `git commit -a`.
   */
  public static commitTouchedFiles(projectRoot: string, touchedFiles: string[], commitMessage: string): boolean {
    const gitDir = join(projectRoot, ".git");
    if (!existsSync(gitDir) || touchedFiles.length === 0) return false;

    // Clean stale lock file if present
    const lockFile = join(projectRoot, ".git", "index.lock");
    if (existsSync(lockFile)) {
      try { unlinkSync(lockFile); } catch {}
    }

    // Filter and stage each touched file explicitly
    const cleanFiles = touchedFiles
      .map(f => f.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, ""))
      .filter(f => f && existsSync(join(projectRoot, f)));

    if (cleanFiles.length === 0) {
      console.warn("[BrownfieldGitGuard] No existing touched files found on disk to stage.");
      return false;
    }

    for (const f of cleanFiles) {
      this.runGit(`git add "${f}"`, projectRoot);
    }

    const cleanMsg = commitMessage.replace(/"/g, "'");
    const result = this.runGit(`git commit -m "${cleanMsg}"`, projectRoot);
    console.log(`[BrownfieldGitGuard] ✓ Committed ${cleanFiles.length} explicitly touched file(s): ${cleanFiles.join(", ")}`);
    return !result.includes("nothing to commit");
  }

  /**
   * Detects the repository's primary/default branch (main, master, develop, etc.)
   */
  public static getDefaultBranchName(projectRoot: string): string {
    const defaultRef = this.runGit("git symbolic-ref refs/remotes/origin/HEAD", projectRoot);
    if (defaultRef) {
      const match = defaultRef.match(/origin\/(.+)$/);
      if (match) return match[1];
    }
    // Check if main exists
    const hasMain = this.runGit("git rev-parse --verify main", projectRoot);
    if (hasMain && !hasMain.includes("fatal")) return "main";

    // Check if master exists
    const hasMaster = this.runGit("git rev-parse --verify master", projectRoot);
    if (hasMaster && !hasMaster.includes("fatal")) return "master";

    // Fall back to current branch
    return this.getCurrentBranch(projectRoot);
  }

  /**
   * Captures the commit SHA of the default branch.
   */
  public static getDefaultBranchHead(projectRoot: string): string {
    const defaultBranch = this.getDefaultBranchName(projectRoot);
    return this.runGit(`git rev-parse ${defaultBranch}`, projectRoot) || "";
  }

  /**
   * Returns the current active branch name.
   */
  public static getCurrentBranch(projectRoot: string): string {
    return this.runGit("git rev-parse --abbrev-ref HEAD", projectRoot) || "HEAD";
  }

  /**
   * Checks if a branch already exists locally.
   */
  public static checkBranchExists(branchName: string, projectRoot: string): boolean {
    const check = this.runGit(`git rev-parse --verify ${branchName}`, projectRoot);
    return Boolean(check && !check.includes("fatal"));
  }

  /**
   * Safely creates and switches to a dedicated feature branch.
   * Rejects silently overwriting existing branches.
   */
  public static createFeatureBranch(
    branchName: string,
    projectRoot: string
  ): { success: boolean; error?: string } {
    const gitDir = join(projectRoot, ".git");
    if (!existsSync(gitDir)) {
      return { success: false, error: "Not a Git repository." };
    }

    if (this.checkBranchExists(branchName, projectRoot)) {
      return {
        success: false,
        error: `FEATURE_BRANCH_EXISTS: Branch "${branchName}" already exists. Cannot overwrite existing feature branch.`,
      };
    }

    try {
      execSync(`git checkout -b "${branchName}"`, {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
      console.log(`[BrownfieldGitGuard] 🌿 Switched to dedicated feature branch: "${branchName}"`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Failed to create feature branch: ${e.message}` };
    }
  }

  /**
   * Switches to an existing branch safely.
   */
  public static checkoutBranch(branchName: string, projectRoot: string): boolean {
    try {
      execSync(`git checkout "${branchName}"`, {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
      return true;
    } catch {
      return false;
    }
  }
}
