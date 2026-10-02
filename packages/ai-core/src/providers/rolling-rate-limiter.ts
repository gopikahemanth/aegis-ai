/**
 * RollingTokenRateLimiter
 *
 * Implements a client-side rolling 60-second window token bucket rate limiter.
 * Prevents breaching provider TPM (Tokens Per Minute) ceilings by throttling
 * and sleeping when burst requests approach the limit.
 *
 * Supports pre-request reservation and post-response reconciliation to prevent
 * drift across multi-step generation pipelines.
 */

export interface TokenReservation {
  id: string;
  timestamp: number;
  tokens: number;
}

export class RollingTokenRateLimiter {
  private readonly windowMs = 60000; // 60 seconds rolling window
  private history: Array<{ timestamp: number; tokens: number }> = [];
  private reservations = new Map<string, TokenReservation>();

  constructor(public readonly tpmLimit: number = 6000) {}

  /**
   * Prunes records older than 60 seconds from history.
   */
  private prune(now: number = Date.now()): void {
    const cutoff = now - this.windowMs;
    this.history = this.history.filter(entry => entry.timestamp > cutoff);

    // Prune stale reservations older than 2 minutes (e.g. from crashed calls)
    const staleReservationCutoff = now - 120000;
    for (const [id, res] of this.reservations.entries()) {
      if (res.timestamp < staleReservationCutoff) {
        this.reservations.delete(id);
      }
    }
  }

  /**
   * Computes the current total tokens consumed + reserved in the rolling 60-second window.
   */
  public getCurrentRollingTokens(now: number = Date.now()): number {
    this.prune(now);
    const historyTotal = this.history.reduce((sum, entry) => sum + entry.tokens, 0);
    let reservedTotal = 0;
    for (const res of this.reservations.values()) {
      reservedTotal += res.tokens;
    }
    return historyTotal + reservedTotal;
  }

  /**
   * Checks if adding `estimatedTokens` would exceed `tpmLimit`.
   * If yes, sleeps until sufficient tokens age out of the 60s window.
   * Then creates and returns a reservation ID.
   */
  public async reserveTokens(estimatedTokens: number): Promise<string> {
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    while (true) {
      const now = Date.now();
      this.prune(now);

      const currentTotal = this.getCurrentRollingTokens(now);

      // If adding estimatedTokens fits within TPM limit
      if (currentTotal + estimatedTokens <= this.tpmLimit) {
        this.reservations.set(reservationId, {
          id: reservationId,
          timestamp: now,
          tokens: estimatedTokens,
        });
        return reservationId;
      }

      // If single request exceeds the entire TPM limit, we can't fit it even when empty
      if (estimatedTokens > this.tpmLimit) {
        console.warn(
          `[RollingRateLimiter] ⚠️ Single request estimate (${estimatedTokens} tokens) exceeds total TPM limit (${this.tpmLimit}). Permitting with reservation after drain.`
        );
        // Wait until history completely drains
        if (this.history.length > 0) {
          const oldest = this.history[0];
          const waitTime = Math.max(100, oldest.timestamp + this.windowMs - now + 100);
          console.log(`[RollingRateLimiter] ⏳ Draining TPM window... sleeping ${(waitTime / 1000).toFixed(1)}s`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          this.reservations.set(reservationId, {
            id: reservationId,
            timestamp: now,
            tokens: estimatedTokens,
          });
          return reservationId;
        }
      }

      // Calculate how long until enough history entries expire
      let tokensNeededToDrain = (currentTotal + estimatedTokens) - this.tpmLimit;
      let tokensFound = 0;
      let targetTimestamp = now;

      for (const entry of this.history) {
        tokensFound += entry.tokens;
        targetTimestamp = entry.timestamp;
        if (tokensFound >= tokensNeededToDrain) {
          break;
        }
      }

      const waitTimeMs = Math.max(250, targetTimestamp + this.windowMs - now + 200);
      console.log(
        `[RollingRateLimiter] ⏳ TPM threshold reached (${currentTotal}/${this.tpmLimit}). Waiting ${(waitTimeMs / 1000).toFixed(1)}s for window to clear...`
      );
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
    }
  }

  /**
   * Reconciles a reservation with actual reported usage from provider response.
   */
  public reconcileUsage(reservationId: string, actualTokens: number): void {
    this.reservations.delete(reservationId);
    this.history.push({
      timestamp: Date.now(),
      tokens: actualTokens,
    });
  }

  /**
   * Releases a reservation if the request failed before completing.
   * If `retainedPromptEstimate` is provided, records prompt tokens that were still consumed by provider.
   */
  public releaseReservation(reservationId: string, retainedPromptEstimate = 0): void {
    this.reservations.delete(reservationId);
    if (retainedPromptEstimate > 0) {
      this.history.push({
        timestamp: Date.now(),
        tokens: retainedPromptEstimate,
      });
    }
  }

  /**
   * Resets rate limiter state (useful for tests).
   */
  public reset(): void {
    this.history = [];
    this.reservations.clear();
  }
}
