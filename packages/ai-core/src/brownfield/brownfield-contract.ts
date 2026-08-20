export type GenerationMode = "GREENFIELD" | "BROWNFIELD";

export type BrownfieldGitStatus = "CLEAN" | "DIRTY_SAFE" | "DIRTY_TARGET_CONFLICT";

export interface GitWorkingState {
  isGitRepo: boolean;
  branch: string;
  headCommit: string;
  isClean: boolean;
  dirtyFiles: string[];
  untrackedFiles: string[];
}

export interface ImpactSet {
  mustChange: string[];
  mayChange: string[];
  readOnly: string[];
  protected: string[];
}

export type PatchOperationType = "CREATE" | "SURGICAL_PATCH" | "SCHEMA_EXTEND";

export interface SurgicalPatchBlock {
  search: string;
  replace: string;
  description?: string;
}

export interface PlannedPatch {
  filePath: string;
  operation: PatchOperationType;
  newContent?: string;
  patchBlocks?: SurgicalPatchBlock[];
  reason: string;
  targetSymbols?: string[];
}

export interface TestInventory {
  framework: "vitest" | "jest" | "none";
  testFiles: string[];
  testCommand: string;
  baselinePassedTests: number;
  baselineTotalTests: number;
  baselineExitCode: number;
}

export interface BrownfieldProjectContract {
  mode: GenerationMode;
  repository: {
    rootPath: string;
    gitState: GitWorkingState;
  };
  stack: {
    framework: string;
    packageManager: "pnpm" | "npm" | "yarn";
    buildTool: string;
    hasTypeScript: boolean;
  };
  architecture: {
    entryPoints: string[];
    routerFile?: string;
    routes: string[];
    models: string[];
    schemaPath?: string;
    apiEndpoints: string[];
  };
  testInventory: TestInventory;
  userRequest: {
    rawPrompt: string;
    featureSummary: string;
    inferredEntities: string[];
  };
  impactSet: ImpactSet;
  plannedPatches: PlannedPatch[];
  checkpointId?: string;
}
