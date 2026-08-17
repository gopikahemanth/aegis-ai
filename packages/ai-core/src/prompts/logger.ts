import type { PromptLogEntry, ProjectContext, TaskContext } from "./types.js";

export class PromptLogger {
  private static logs: PromptLogEntry[] = [];

  public static log(entry: Omit<PromptLogEntry, "timestamp">): PromptLogEntry {
    const fullEntry: PromptLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(fullEntry);
    return fullEntry;
  }

  public static logCall(
    agent: string,
    promptVersion: string,
    projectContext: ProjectContext,
    taskContext?: TaskContext,
    status: "VALID" | "INVALID" | "REJECTED" = "VALID",
    rejectionReason?: string
  ): PromptLogEntry {
    return this.log({
      generationId: projectContext.generationId,
      projectId: projectContext.projectId,
      taskId: taskContext?.taskId,
      agent,
      promptVersion,
      contractHash: projectContext.contractHash,
      architectureHash: projectContext.architectureHash,
      inputSummary: `Agent: ${agent} | Prompt: ${projectContext.originalRequest.slice(0, 60)}...`,
      validationStatus: status,
      rejectionReason,
    });
  }

  public static getLogs(generationId?: string): PromptLogEntry[] {
    if (generationId) {
      return this.logs.filter((l) => l.generationId === generationId);
    }
    return [...this.logs];
  }

  public static clear(): void {
    this.logs = [];
  }
}
