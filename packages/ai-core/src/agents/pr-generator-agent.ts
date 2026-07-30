import { BaseAgent } from "./base-agent.js";
import { execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export class PRGeneratorAgent extends BaseAgent {
  readonly name = "PR Generator & Regression Auditor";

  async execute(projectPath: string, request: string): Promise<string> {
    let diff = "";
    try {
      // Get the git diff of unstaged/staged files against HEAD or previous commit
      diff = execSync("git diff HEAD", { cwd: projectPath, encoding: "utf8", stdio: "pipe" }).trim();
      if (!diff) {
        diff = execSync("git log -n 1 -p", { cwd: projectPath, encoding: "utf8", stdio: "pipe" }).trim();
      }
    } catch (e: any) {
      diff = "(No active git diff retrieved)";
    }

    const prompt = `You are the Aegis AI QA & Lead Auditor.
Perform a regression audit on the following git diff for the project request: "${request}".

Git Diff:
"""
${diff.slice(0, 12000)}
"""

Formulate a professional Pull Request summary in Markdown containing:
1. Title: Describing changes
2. Summary: Highlight what is implemented
3. Code Changes Breakdown: Files modified/created and their purpose
4. Regression Risk Audit: Identify potential vulnerabilities, stale closures, circular imports, or styling shifts in the diff
5. OWASP Security Assessment: Verify no secrets or injection issues are present in this diff
6. Testing Coverage: Recommended manual validation checks

Output ONLY the formatted markdown document.`;

    const response = await this.provider.chat([
      { role: "system", content: "You are a professional principal software engineer and QA auditor." },
      { role: "user", content: prompt }
    ], {
      model: "gemini-3.5-flash-lite",
      temperature: 0.1
    });

    // Save to pull-request.md
    const prPath = join(projectPath, "pull-request.md");
    try {
      writeFileSync(prPath, response, "utf8");
      console.log(`[Lifecycle] ✓ Pull request summary with Regression Audit saved to: ${prPath}`);
    } catch (err: any) {
      console.warn(`[Lifecycle] Warning: Failed to write PR template: ${err.message}`);
    }

    return response;
  }
}
