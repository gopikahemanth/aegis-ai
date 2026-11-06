/**
 * GenerationBudgetGuard
 *
 * Centralized, fail-closed enforcement of provider call budgets, token limits,
 * repair iterations, and single-generation boundaries for AEGIS AI.
 *
 * Enforced Limits (Phase 8):
 * - Maximum 12 provider requests.
 * - Maximum 75,000 input (prompt) tokens.
 * - Maximum 20,000 output (completion) tokens.
 * - Maximum 1 complete generation attempt (zero full regenerations).
 * - Maximum 2 targeted repairs per failing stage.
 *
 * Behavior on limit violation:
 * - Immediately stops further AI calls.
 * - Preserves all generated files on disk.
 * - Fails closed with status: "BLOCKED" and reason: "BUDGET_EXHAUSTED".
 * - Never claims false success or silently omits requirements.
 */

export class BudgetExceededError extends Error {
  public readonly code = "BUDGET_EXHAUSTED";
  constructor(message: string) {
    super(`BUDGET_EXHAUSTED: ${message}`);
    this.name = "BudgetExceededError";
  }
}

export class ProviderOutageHaltError extends Error {
  public readonly code = "PROVIDER_OUTAGE_HALT";
  constructor(message: string) {
    super(`PROVIDER_OUTAGE_HALT: ${message}`);
    this.name = "ProviderOutageHaltError";
  }
}

export class ConcurrentGenerationError extends Error {
  public readonly code = "CONCURRENT_GENERATION_REJECTED";
  constructor(message: string) {
    super(`CONCURRENT_GENERATION_REJECTED: ${message}`);
    this.name = "ConcurrentGenerationError";
  }
}

export interface GenerationBudgetConfig {
  maxRequests?: number;
  maxPromptTokens?: number;
  maxCompletionTokens?: number;
  maxGenerations?: number;
  maxRepairsPerStage?: number;
}

export interface GenerationBudgetStatus {
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  generationCount: number;
  repairCountsByStage: Record<string, number>;
  isHalted: boolean;
  haltReason?: string;
  remainingRequests: number;
  remainingPromptTokens: number;
  remainingCompletionTokens: number;
}

export class GenerationBudgetGuard {
  private static instance: GenerationBudgetGuard;

  private maxRequests = 12;
  private maxPromptTokens = 75000;
  private maxCompletionTokens = 20000;
  private maxGenerations = 1;
  private maxRepairsPerStage = 2;

  private requestCount = 0;
  private promptTokens = 0;
  private completionTokens = 0;
  private generationCount = 0;
  private repairCountsByStage = new Map<string, number>();

  private isHalted = false;
  private haltReason?: string;

  private activeGenerationId: string | null = null;
  private activeGenerationStartTime: number | null = null;

  public static getInstance(): GenerationBudgetGuard {
    if (!GenerationBudgetGuard.instance) {
      GenerationBudgetGuard.instance = new GenerationBudgetGuard();
    }
    return GenerationBudgetGuard.instance;
  }

  public configure(config: GenerationBudgetConfig): void {
    if (config.maxRequests !== undefined) this.maxRequests = config.maxRequests;
    if (config.maxPromptTokens !== undefined) this.maxPromptTokens = config.maxPromptTokens;
    if (config.maxCompletionTokens !== undefined) this.maxCompletionTokens = config.maxCompletionTokens;
    if (config.maxGenerations !== undefined) this.maxGenerations = config.maxGenerations;
    if (config.maxRepairsPerStage !== undefined) this.maxRepairsPerStage = config.maxRepairsPerStage;
  }

  public reset(): void {
    this.requestCount = 0;
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.generationCount = 0;
    this.repairCountsByStage.clear();
    this.isHalted = false;
    this.haltReason = undefined;
  }

  /**
   * Acquires the active generation lock for a new generation run.
   * If another generation is currently in progress, it rejects immediately with
   * ConcurrentGenerationError to prevent budget contamination.
   */
  public acquireGenerationLock(generationId: string | number = `gen_${Date.now()}`): string {
    const idStr = String(generationId);
    if (this.activeGenerationId && this.activeGenerationId !== idStr) {
      throw new ConcurrentGenerationError(
        `Another project generation [id: "${this.activeGenerationId}"] is currently active in this process. Overlapping concurrent generations are prohibited to prevent budget contamination and file corruption.`
      );
    }
    this.reset();
    this.activeGenerationId = idStr;
    this.activeGenerationStartTime = Date.now();
    this.recordGenerationStart();
    return idStr;
  }

  /**
   * Releases the active generation lock.
   */
  public releaseGenerationLock(generationId?: string | number): void {
    const idStr = generationId !== undefined ? String(generationId) : undefined;
    if (!idStr || this.activeGenerationId === idStr) {
      this.activeGenerationId = null;
      this.activeGenerationStartTime = null;
    }
  }

  public isGenerationActive(): boolean {
    return this.activeGenerationId !== null;
  }

  public getActiveGenerationId(): string | null {
    return this.activeGenerationId;
  }

  /**
   * Asserts whether a new provider request is allowed under the current budget.
   * Throws BudgetExceededError or ProviderOutageHaltError if budget is exhausted.
   *
   * @param stageOrAgent Optional caller label (e.g. "coder", "healer", "BackendApiRepair")
   * @param estimatedPromptTokens Pre-dispatch estimate of prompt tokens
   * @param requestedOutputTokens Pre-dispatch requested completion allowance
   */
  public assertRequestAllowed(
    stageOrAgent?: string,
    estimatedPromptTokens?: number,
    requestedOutputTokens?: number,
  ): void {
    if (this.isHalted) {
      throw new BudgetExceededError(
        this.haltReason || "Execution halted due to budget exhaustion or provider outage."
      );
    }

    if (this.requestCount >= this.maxRequests) {
      this.isHalted = true;
      this.haltReason = `Maximum provider requests limit (${this.maxRequests}) reached (attempted request #${this.requestCount + 1}${stageOrAgent ? ` for ${stageOrAgent}` : ""}).`;
      throw new BudgetExceededError(this.haltReason);
    }

    if (estimatedPromptTokens !== undefined && estimatedPromptTokens > 0) {
      if (this.promptTokens + estimatedPromptTokens > this.maxPromptTokens) {
        throw new BudgetExceededError(
          `Estimated input tokens (${estimatedPromptTokens.toLocaleString()}) would exceed remaining prompt token budget (${(this.maxPromptTokens - this.promptTokens).toLocaleString()}) [limit: ${this.maxPromptTokens.toLocaleString()}, current: ${this.promptTokens.toLocaleString()}].`
        );
      }
    }

    if (this.promptTokens >= this.maxPromptTokens) {
      this.isHalted = true;
      this.haltReason = `Maximum input token budget (${this.maxPromptTokens.toLocaleString()}) reached (consumed: ${this.promptTokens.toLocaleString()}).`;
      throw new BudgetExceededError(this.haltReason);
    }

    if (requestedOutputTokens !== undefined && requestedOutputTokens > 0) {
      if (this.completionTokens + requestedOutputTokens > this.maxCompletionTokens) {
        throw new BudgetExceededError(
          `Requested output allowance (${requestedOutputTokens.toLocaleString()}) exceeds remaining output token budget (${(this.maxCompletionTokens - this.completionTokens).toLocaleString()}) [limit: ${this.maxCompletionTokens.toLocaleString()}, current: ${this.completionTokens.toLocaleString()}].`
        );
      }
    }

    if (this.completionTokens >= this.maxCompletionTokens) {
      this.isHalted = true;
      this.haltReason = `Maximum output token budget (${this.maxCompletionTokens.toLocaleString()}) reached (consumed: ${this.completionTokens.toLocaleString()}).`;
      throw new BudgetExceededError(this.haltReason);
    }
  }

  /**
   * Clamps a requested maxTokens parameter to the remaining completion token budget.
   * Throws BudgetExceededError if the remaining completion budget is 0.
   */
  public clampOutputTokens(requestedMaxTokens?: number): number {
    const remaining = this.getRemainingCompletionTokens();
    if (remaining <= 0) {
      throw new BudgetExceededError(
        `Maximum output token budget (${this.maxCompletionTokens.toLocaleString()}) reached (remaining: 0).`
      );
    }
    if (requestedMaxTokens === undefined) {
      return remaining;
    }
    return Math.min(requestedMaxTokens, remaining);
  }

  /**
   * Asserts whether a requested output allowance is within the remaining budget.
   * Throws BudgetExceededError if requestedTokens exceeds remaining completion budget.
   */
  public assertOutputAllowed(requestedTokens: number): void {
    const remaining = this.getRemainingCompletionTokens();
    if (requestedTokens > remaining) {
      throw new BudgetExceededError(
        `Requested output allowance (${requestedTokens.toLocaleString()}) exceeds remaining output token budget (${remaining.toLocaleString()}).`
      );
    }
  }

  public getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requestCount);
  }

  public getRemainingPromptTokens(): number {
    return Math.max(0, this.maxPromptTokens - this.promptTokens);
  }

  public getRemainingCompletionTokens(): number {
    return Math.max(0, this.maxCompletionTokens - this.completionTokens);
  }

  /**
   * Records a dispatched provider request.
   */
  public recordRequest(): void {
    this.requestCount += 1;
  }

  /**
   * Records actual measured token usage from provider response metadata.
   */
  public recordUsage(prompt: number, completion: number): void {
    if (prompt > 0) this.promptTokens += prompt;
    if (completion > 0) this.completionTokens += completion;

    // Check if limits exceeded after recording
    if (this.promptTokens >= this.maxPromptTokens) {
      this.isHalted = true;
      this.haltReason = `Maximum input token budget (${this.maxPromptTokens.toLocaleString()}) reached (consumed: ${this.promptTokens.toLocaleString()}).`;
    } else if (this.completionTokens >= this.maxCompletionTokens) {
      this.isHalted = true;
      this.haltReason = `Maximum output token budget (${this.maxCompletionTokens.toLocaleString()}) reached (consumed: ${this.completionTokens.toLocaleString()}).`;
    }
  }

  /**
   * Records conservatively estimated usage when provider does not report token usage metadata.
   */
  public recordUnmeteredUsage(estimatedPrompt: number, estimatedCompletion: number): void {
    this.recordUsage(estimatedPrompt, estimatedCompletion);
  }

  /**
   * Reconciles estimated pre-dispatch prompt tokens with actual post-completion provider usage.
   * If actual provider usage is absent (unmetered), conservative estimates are applied without undercounting.
   */
  public reconcileActualUsage(
    estimatedPrompt: number,
    actualPrompt?: number,
    actualCompletion?: number,
  ): void {
    const prompt = (actualPrompt !== undefined && actualPrompt > 0) ? actualPrompt : estimatedPrompt;
    const completion = actualCompletion ?? 0;
    this.recordUsage(prompt, completion);
  }

  /**
   * Asserts whether a targeted repair attempt is allowed for the given stage.
   */
  public assertRepairAllowed(stage: string): void {
    if (this.isHalted) {
      throw new BudgetExceededError(this.haltReason || "Budget exhausted.");
    }

    const currentAttempts = this.repairCountsByStage.get(stage) || 0;
    if (currentAttempts >= this.maxRepairsPerStage) {
      throw new BudgetExceededError(
        `Targeted repair budget exhausted: Stage "${stage}" reached maximum ${this.maxRepairsPerStage} repair attempts.`
      );
    }
  }

  /**
   * Records a targeted repair attempt for the given stage.
   */
  public recordRepairAttempt(stage: string): void {
    const current = this.repairCountsByStage.get(stage) || 0;
    this.repairCountsByStage.set(stage, current + 1);
  }

  /**
   * Asserts whether starting a new full generation is allowed (max 1 generation).
   */
  public assertGenerationAllowed(): void {
    if (this.generationCount >= this.maxGenerations) {
      this.isHalted = true;
      this.haltReason = `Maximum generation attempts (${this.maxGenerations}) reached. Repeated full website regenerations are prohibited.`;
      throw new BudgetExceededError(this.haltReason);
    }
  }

  /**
   * Records initiation of a complete generation run.
   */
  public recordGenerationStart(): void {
    this.generationCount += 1;
  }

  /**
   * Halts generation immediately on rate limit exhaustion or unrecoverable provider outage.
   */
  public haltOnProviderOutage(reason: string): void {
    this.isHalted = true;
    this.haltReason = `Provider outage / rate limit halt: ${reason}`;
  }

  /**
   * Returns current budget consumption and remaining allocation.
   */
  public getStatus(): GenerationBudgetStatus {
    const repairCounts: Record<string, number> = {};
    for (const [k, v] of this.repairCountsByStage.entries()) {
      repairCounts[k] = v;
    }

    return {
      requestCount: this.requestCount,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.promptTokens + this.completionTokens,
      generationCount: this.generationCount,
      repairCountsByStage: repairCounts,
      isHalted: this.isHalted,
      haltReason: this.haltReason,
      remainingRequests: Math.max(0, this.maxRequests - this.requestCount),
      remainingPromptTokens: Math.max(0, this.maxPromptTokens - this.promptTokens),
      remainingCompletionTokens: Math.max(0, this.maxCompletionTokens - this.completionTokens),
    };
  }
}
