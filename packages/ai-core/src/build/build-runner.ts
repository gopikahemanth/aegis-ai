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
          },
        );

      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
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
