// We will generate lightweight IDs using simple timestamps to keep dependencies minimal

export interface AgentJob {
  id: string;
  taskTitle: string;
  targetRole: string;
  status: "pending" | "processing" | "completed" | "failed";
  payload: any;
  retries: number;
  maxRetries: number;
  errorLog?: string;
}

export interface WorkerCallback {
  role: string;
  callback: (job: AgentJob) => Promise<any>;
}

export class DistributedRuntimeEngine {
  private jobQueue: AgentJob[] = [];
  private workers: Map<string, WorkerCallback> = new Map();
  private completedJobs: AgentJob[] = [];

  // Register a dynamic worker subscription (specialist role)
  registerWorker(role: string, callback: (job: AgentJob) => Promise<any>) {
    this.workers.set(role, { role, callback });
    console.log(`[Runtime] Worker registered for role: [${role}]`);
  }

  // Add a task to the queue
  enqueueJob(taskTitle: string, targetRole: string, payload: any, maxRetries = 3) {
    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const job: AgentJob = {
      id: jobId,
      taskTitle,
      targetRole,
      status: "pending",
      payload,
      retries: 0,
      maxRetries
    };
    this.jobQueue.push(job);
    console.log(`[Runtime] Enqueued job: "${taskTitle}" (ID: ${jobId}, Target: ${targetRole})`);
    return jobId;
  }

  // Process the queue with fault tolerance, exponential backoff retries, and queues mapping
  async processQueue() {
    console.log(`\n[Runtime] Starting message processing loop for ${this.jobQueue.length} queued tasks...`);

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()!;
      job.status = "processing";
      console.log(`\n[Runtime] [Job: ${job.id}] Dispatched to worker queue...`);

      const worker = this.workers.get(job.targetRole);
      if (!worker) {
        job.status = "failed";
        job.errorLog = `No worker registered for target role: ${job.targetRole}`;
        console.error(`[Runtime] ✗ Job ${job.id} failed: ${job.errorLog}`);
        this.completedJobs.push(job);
        continue;
      }

      let success = false;
      while (job.retries < job.maxRetries && !success) {
        try {
          // Invoke the registered specialist agent worker
          await worker.callback(job);
          job.status = "completed";
          success = true;
          console.log(`[Runtime] ✓ Job ${job.id} finished successfully by [${job.targetRole}].`);
          this.completedJobs.push(job);
        } catch (err: any) {
          job.retries++;
          job.errorLog = err.message;
          console.warn(`[Runtime] ⚠️ Job ${job.id} failed attempt ${job.retries}/${job.maxRetries}: ${err.message}`);
          
          if (job.retries < job.maxRetries) {
            const backoffMs = Math.pow(2, job.retries) * 100; // Exponential backoff
            console.log(`[Runtime] Backing off for ${backoffMs}ms before retry...`);
            await new Promise(res => setTimeout(res, backoffMs));
          }
        }
      }

      if (!success) {
        job.status = "failed";
        console.error(`[Runtime] ✗ Job ${job.id} reached maximum retries limit and failed.`);
        this.completedJobs.push(job);
      }
    }

    console.log("[Runtime] Queue drained. Finished processing all agent jobs.\n");
  }

  getJobStatus(jobId: string): AgentJob | undefined {
    return this.completedJobs.find(j => j.id === jobId) || this.jobQueue.find(j => j.id === jobId);
  }

  getCompletedJobs(): AgentJob[] {
    return this.completedJobs;
  }
}
