export interface ProjectArchitecture {
  frontend: string;
  backend: string;
  database: string;
  orm: string;
  auth: string;
  language: string;
  styling: string;
}

export interface ProjectDomainVocabulary {
  entityName: string;
  entityPlural: string;
  primaryMetrics: string[];
  actionVerbs: string[];
  domainPrefix: string;
}

export interface ApiContract {
  method: string;
  path: string;
  description: string;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
}

export interface ProjectContext {
  projectId: string;
  generationId: string;
  originalRequest: string;
  requirements: string[];
  features: string[];
  workflows: string[];
  architecture: ProjectArchitecture;
  dataModels: string[];
  apiContracts: ApiContract[];
  routes: string[];
  allowedTechnologies: string[];
  forbiddenTechnologies: string[];
  domainVocabulary: ProjectDomainVocabulary;
  canonicalFiles: string[];
  acceptanceCriteria: string[];
  contractVersion: string;
  contractHash: string;
  architectureHash: string;
}

export interface TaskContext {
  taskId: string;
  title: string;
  description: string;
  dependencies: string[];
  ownedFiles: string[];
  allowedFiles: string[];
  requiredExports: string[];
  requiredImports: string[];
  acceptanceCriteria: string[];
  verificationCommands: string[];
  projectContractHash: string;
  architectureHash: string;
}

export interface RepairContext {
  failureId: string;
  failureType: string;
  errorMessage: string;
  stackTrace?: string;
  browserConsole?: string;
  networkFailure?: string;
  serverLogs?: string;
  affectedFiles: string[];
  currentProjectContract: ProjectContext;
  currentTask?: TaskContext;
  previousAttempts: number;
  checkpoint: string;
  expectedBehavior: string;
}

export interface FeatureChangeContext {
  currentProject: ProjectContext;
  newFeatureRequest: string;
  impactAnalysis: {
    affectedFiles: string[];
    affectedApis: string[];
    affectedModels: string[];
    affectedRoutes: string[];
    securityImpact: string;
  };
  acceptanceCriteria: string[];
}

export interface FinalAuditContext {
  originalRequest: string;
  projectContext: ProjectContext;
  implementedFeatures: string[];
  actualFilesystem: string[];
  buildOutput: { status: "PASS" | "FAIL"; output: string };
  testOutput: { status: "PASS" | "FAIL"; output: string };
  runtimeOutput: { status: "PASS" | "FAIL"; output: string };
  browserOutput: { status: "PASS" | "FAIL"; consoleLogs: string[]; screenshotPath?: string };
  realityCheckerOutput: { status: "PASS" | "FAIL"; missingFeatures: string[] };
  visualReviewerOutput: { status: "PASS" | "FAIL"; observations: string[] };
  securityOutput: { status: "PASS" | "FAIL"; vulnerabilities: string[] };
  knownEnvironmentBlockers: string[];
}

export interface PromptLogEntry {
  timestamp: string;
  generationId: string;
  projectId: string;
  taskId?: string;
  agent: string;
  promptVersion: string;
  contractHash: string;
  architectureHash: string;
  inputSummary: string;
  validationStatus: "VALID" | "INVALID" | "REJECTED";
  rejectionReason?: string;
}
