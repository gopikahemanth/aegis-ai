/**
 * ProgressEvents
 *
 * Real-time structured progress event emission with guaranteed secret redaction.
 */

import { JobStore } from "./job-store.js";

export type ProgressEventType =
  | "JOB_CREATED"
  | "JOB_STARTED"
  | "STAGE_STARTED"
  | "STAGE_COMPLETED"
  | "TASK_READY"
  | "TASK_STARTED"
  | "TASK_COMPLETED"
  | "TASK_FAILED"
  | "TASK_BLOCKED"
  | "CACHE_HIT"
  | "CACHE_MISS"
  | "LLM_CALL_STARTED"
  | "LLM_CALL_COMPLETED"
  | "REPAIR_STARTED"
  | "REPAIR_COMPLETED"
  | "ROLLBACK_STARTED"
  | "ROLLBACK_COMPLETED"
  | "BUILD_STARTED"
  | "BUILD_COMPLETED"
  | "SERVER_STARTED"
  | "SERVER_STOPPED"
  | "API_TEST_STARTED"
  | "API_TEST_COMPLETED"
  | "BROWSER_TEST_STARTED"
  | "BROWSER_TEST_COMPLETED"
  | "AUTHORIZATION_REQUIRED"
  | "AUTHORIZATION_GRANTED"
  | "AUTHORIZATION_DENIED"
  | "VERIFICATION_STARTED"
  | "VERIFICATION_COMPLETED"
  | "JOB_PAUSED"
  | "JOB_RESUMED"
  | "JOB_CANCELLED"
  | "JOB_COMPLETED"
  | "JOB_FAILED";

export interface ProgressEvent {
  eventId: string;
  jobId: string;
  projectId: string;
  generationId: string;
  timestamp: string;
  eventType: ProgressEventType;
  stage: string;
  payload: Record<string, any>;
}

export type ProgressListener = (event: ProgressEvent) => void;

export class ProgressEventEmitter {
  private static listeners: Set<ProgressListener> = new Set();
  private static eventsLog: Map<string, ProgressEvent[]> = new Map(); // jobId -> events

  public static subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public static emit(
    jobId: string,
    projectId: string,
    generationId: string,
    eventType: ProgressEventType,
    stage: string,
    payload: Record<string, any> = {}
  ): ProgressEvent {
    const rawEvent: ProgressEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      jobId,
      projectId,
      generationId,
      timestamp: new Date().toISOString(),
      eventType,
      stage,
      payload,
    };

    // Guarantee secret redaction
    const sanitizedJson = JobStore.sanitize(JSON.stringify(rawEvent));
    const sanitizedEvent: ProgressEvent = JSON.parse(sanitizedJson);

    if (!this.eventsLog.has(jobId)) {
      this.eventsLog.set(jobId, []);
    }
    this.eventsLog.get(jobId)!.push(sanitizedEvent);

    for (const listener of this.listeners) {
      try {
        listener(sanitizedEvent);
      } catch (err) {
        console.error("[ProgressEventEmitter] Listener error:", err);
      }
    }

    return sanitizedEvent;
  }

  public static getEvents(jobId: string): ProgressEvent[] {
    return this.eventsLog.get(jobId) || [];
  }

  public static clear(): void {
    this.listeners.clear();
    this.eventsLog.clear();
  }
}
