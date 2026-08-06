export interface ValidationStateRecord {
  latestBuildSuccess: boolean;
  latestRuntimeSuccess: boolean;
  latestRealityCheckPassed: boolean;
  latestVisualReviewPassed: boolean;
  latestSemanticScore: number;
  buildDiagnostics?: string;
  visualObservations: string[];
  timestamp: string;
}

export class ValidationStateManager {
  private static instance: ValidationStateManager;
  private state: ValidationStateRecord = {
    latestBuildSuccess: false,
    latestRuntimeSuccess: false,
    latestRealityCheckPassed: false,
    latestVisualReviewPassed: false,
    latestSemanticScore: 0,
    visualObservations: [],
    timestamp: new Date().toISOString()
  };

  public static getInstance(): ValidationStateManager {
    if (!ValidationStateManager.instance) {
      ValidationStateManager.instance = new ValidationStateManager();
    }
    return ValidationStateManager.instance;
  }

  public recordBuild(success: boolean, diagnostics?: string): void {
    this.state.latestBuildSuccess = success;
    this.state.buildDiagnostics = success ? undefined : diagnostics;
    this.state.timestamp = new Date().toISOString();
  }

  public recordRuntime(success: boolean): void {
    this.state.latestRuntimeSuccess = success;
    this.state.timestamp = new Date().toISOString();
  }

  public recordRealityCheck(passed: boolean): void {
    this.state.latestRealityCheckPassed = passed;
    this.state.timestamp = new Date().toISOString();
  }

  public recordVisualReview(passed: boolean, observations: string[]): void {
    this.state.latestVisualReviewPassed = passed;
    this.state.visualObservations = observations;
    this.state.timestamp = new Date().toISOString();
  }

  public recordSemanticScore(score: number): void {
    this.state.latestSemanticScore = score;
    this.state.timestamp = new Date().toISOString();
  }

  public getState(): ValidationStateRecord {
    return { ...this.state };
  }

  public reset(): void {
    this.state = {
      latestBuildSuccess: false,
      latestRuntimeSuccess: false,
      latestRealityCheckPassed: false,
      latestVisualReviewPassed: false,
      latestSemanticScore: 0,
      visualObservations: [],
      timestamp: new Date().toISOString()
    };
  }
}
