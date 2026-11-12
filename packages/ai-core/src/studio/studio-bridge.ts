/**
 * StudioBridge
 *
 * Phase 11: Aegis Studio Integration
 *
 * Serves as the authoritative bridge between the Aegis AI Orchestrator / JobStateManager
 * and user-facing Studio interfaces (Desktop App, Web Dashboard, and CLI):
 * - Live bidirectional telemetry and job control without mock data
 * - Real-time file explorer reflecting actual disk state
 * - Live preview port and API endpoint routing
 * - Unified verification and repair center telemetry
 */

import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import { JobStateManager, type JobSnapshot, type TaskSnapshot, type OrchestratorJobStatus } from "../orchestrator/job-state-manager.js";
import type { AcceptanceReport } from "../delivery/final-acceptance-gate.js";
import type { RepairSessionReport } from "../repair/root-cause-repair-engine.js";

export interface StudioProjectNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: StudioProjectNode[];
}

export interface StudioLivePreviewInfo {
  active: boolean;
  frontendUrl: string;
  apiUrl: string;
  frontendPort: number;
  backendPort: number;
}

export interface StudioJobTelemetry {
  jobId: string;
  status: OrchestratorJobStatus;
  percentage: number;
  tasksTotal: number;
  tasksCompleted: number;
  durationMs: number;
  currentStage?: string;
  currentTask?: string;
  preview: StudioLivePreviewInfo;
  latestAcceptance?: AcceptanceReport;
  latestRepair?: RepairSessionReport;
}

export class StudioBridge extends EventEmitter {
  private stateManager: JobStateManager;
  private projectRoot: string;
  private frontendPort: number;
  private backendPort: number;

  constructor(
    projectRoot: string,
    stateManager?: JobStateManager,
    ports: { frontendPort?: number; backendPort?: number } = {}
  ) {
    super();
    this.projectRoot = projectRoot;
    this.stateManager = stateManager || new JobStateManager(projectRoot);
    this.frontendPort = ports.frontendPort || 5173;
    this.backendPort = ports.backendPort || 3001;
  }

  /**
   * Retrieves live telemetry and progress snapshot for a job.
   */
  public getTelemetry(jobId: string): StudioJobTelemetry | null {
    const jobState = this.stateManager.getJob();
    if (!jobState) return null;

    const tasks = jobState.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "PASSED").length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const activeTask = tasks.find(t => t.status === "RUNNING");
    const durationMs = Date.now() - new Date(jobState.createdAt).getTime();

    return {
      jobId,
      status: jobState.status,
      percentage,
      tasksTotal: total,
      tasksCompleted: completed,
      durationMs,
      currentStage: jobState.currentStage,
      currentTask: activeTask?.title,
      preview: {
        active: jobState.status === "DELIVERED" || jobState.status === "VERIFYING",
        frontendUrl: `http://localhost:${this.frontendPort}`,
        apiUrl: `http://localhost:${this.backendPort}/api`,
        frontendPort: this.frontendPort,
        backendPort: this.backendPort,
      },
    };
  }

  /**
   * Explores the live project file tree on disk.
   */
  public getFileTree(maxDepth: number = 5): StudioProjectNode {
    return this.buildNode(this.projectRoot, 0, maxDepth);
  }

  /**
   * Controls job lifecycle (PAUSE, RESUME, CANCEL).
   */
  public controlJob(jobId: string, action: "CANCEL" | "PAUSE" | "RESUME"): boolean {
    if (action === "CANCEL") {
      this.stateManager.cancel("Cancelled from Aegis Studio UI");
      this.emit("JOB_CANCELLED", { jobId, action });
      return true;
    }
    this.emit("JOB_ACTION", { jobId, action });
    return true;
  }

  private buildNode(currentPath: string, currentDepth: number, maxDepth: number): StudioProjectNode {
    const name = path.basename(currentPath) || currentPath;
    const isDir = fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory();

    if (!isDir || currentDepth >= maxDepth) {
      let size: number | undefined;
      try {
        if (fs.existsSync(currentPath)) size = fs.statSync(currentPath).size;
      } catch {}
      return {
        name,
        path: path.relative(this.projectRoot, currentPath) || ".",
        type: isDir ? "directory" : "file",
        size,
      };
    }

    const children: StudioProjectNode[] = [];
    try {
      const entries = fs.readdirSync(currentPath);
      for (const entry of entries) {
        if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".aegis") {
          continue;
        }
        children.push(this.buildNode(path.join(currentPath, entry), currentDepth + 1, maxDepth));
      }
    } catch {}

    return {
      name,
      path: path.relative(this.projectRoot, currentPath) || ".",
      type: "directory",
      children,
    };
  }
}
