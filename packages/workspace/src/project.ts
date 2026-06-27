export interface ProjectInfo {
  root: string;

  framework: string;
  language: string;

  packageManager: string;
  buildTool: string;
  monorepo: boolean;

  dependencies: string[];
  scripts: Record<string, string>;
}
