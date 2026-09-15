import { exec } from "node:child_process";
import { promisify } from "node:util";

const execute =
  promisify(exec);

export interface BuildResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export class BuildRunner {
  async run(
    projectPath: string,
  ): Promise<BuildResult> {

    try {
      const {
        stdout,
        stderr,
      } =
        await execute(
          "pnpm build",
          {
            cwd: projectPath,
            env: {
              ...process.env,
              CI: "true",
              CONTINUOUS_INTEGRATION: "true",
              FORCE_COLOR: "0",
              npm_config_confirm_modules_purge: "false",
              npm_config_verify_deps_before_run: "false",
              npm_config_only_built_dependencies: "*",
              npm_config_ignore_scripts: "false",
            },
          },
        );

      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      const pnpmErrMsg = (error.stderr || error.message || "").toLowerCase();
      // If pnpm failed due to pnpm-specific settings/build-script warnings or ignored builds, fallback to npm run build
      if (pnpmErrMsg.includes("onlybuiltdependencies") || pnpmErrMsg.includes("ignored build scripts") || pnpmErrMsg.includes("err_pnpm_ignored_builds") || pnpmErrMsg.includes("the \"pnpm\" field in package.json")) {
        try {
          const fallbackRes = await execute("npm run build", {
            cwd: projectPath,
            env: process.env,
          });
          return {
            success: true,
            stdout: fallbackRes.stdout,
            stderr: fallbackRes.stderr,
          };
        } catch (fallbackErr: any) {
          return {
            success: false,
            stdout: fallbackErr.stdout ?? "",
            stderr: fallbackErr.stderr ?? fallbackErr.message,
          };
        }
      }

      return {
        success: false,
        stdout:
          error.stdout ?? "",
        stderr:
          error.stderr ??
          error.message,
      };
    }
  }
}
