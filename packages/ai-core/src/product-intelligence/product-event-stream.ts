/**
 * ProductEventStream
 *
 * Unified event stream for tracking the end-to-end autonomous product construction lifecycle.
 */

export type ProductEventType =
  | "PRODUCT_RECEIVED"
  | "REQUIREMENTS_ANALYZED"
  | "ARCHITECTURE_PLANNED"
  | "GENERATION_STARTED"
  | "GENERATION_COMPLETED"
  | "BUILD_STARTED"
  | "BUILD_COMPLETED"
  | "BUILD_FAILED"
  | "DEFECT_DETECTED"
  | "REPAIR_STARTED"
  | "REPAIR_COMPLETED"
  | "RUNTIME_STARTED"
  | "WORKFLOW_VERIFIED"
  | "UI_VERIFIED"
  | "PRODUCT_ACCEPTED"
  | "PRODUCT_DELIVERED"
  | "BUILD_FAILED_FATAL";

export interface ProductLifecycleEvent {
  eventId: string;
  type: ProductEventType;
  productName: string;
  stage: string;
  payload: any;
  timestamp: string;
}

export type ProductEventListener = (event: ProductLifecycleEvent) => void;

export class ProductEventStream {
  private static listeners: ProductEventListener[] = [];
  private static eventHistory: ProductLifecycleEvent[] = [];

  public static subscribe(listener: ProductEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public static emit(type: ProductEventType, productName: string, stage: string, payload: any = {}): ProductLifecycleEvent {
    const event: ProductLifecycleEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      productName,
      stage,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.eventHistory.push(event);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Safe emission
      }
    }

    return event;
  }

  public static getHistory(): ProductLifecycleEvent[] {
    return [...this.eventHistory];
  }

  public static clearHistory(): void {
    this.eventHistory = [];
  }
}
