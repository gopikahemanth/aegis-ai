import type { GeneratedFile } from "../writer/writer.js";
import type { ReviewReport } from "../reviewer/review-report.js";


export interface AgentState {
  request: string;

  framework: string;

  projectPath: string;

  attempt: number;

  generatedFiles: GeneratedFile[];

  review?: ReviewReport;

 build?: {
  success: boolean;
  summary: string;
  details?: string;
};

  lastError?: string;

  completed: boolean;
}
