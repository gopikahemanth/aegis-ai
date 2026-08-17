import { describe, it, expect, beforeEach } from "vitest";
import { ProductEventStream } from "../product-event-stream.js";

describe("AEGIS Phase 50 — Product Event Stream", () => {
  beforeEach(() => {
    ProductEventStream.clearHistory();
  });

  it("emits and subscribes to lifecycle events across all stages", () => {
    const receivedEvents: string[] = [];
    const unsubscribe = ProductEventStream.subscribe((event) => {
      receivedEvents.push(event.type);
    });

    ProductEventStream.emit("PRODUCT_RECEIVED", "TestApp", "RECEIVED");
    ProductEventStream.emit("BUILD_STARTED", "TestApp", "BUILDING");
    ProductEventStream.emit("PRODUCT_ACCEPTED", "TestApp", "ACCEPTANCE");

    expect(receivedEvents).toEqual(["PRODUCT_RECEIVED", "BUILD_STARTED", "PRODUCT_ACCEPTED"]);
    expect(ProductEventStream.getHistory().length).toBe(3);

    unsubscribe();
  });
});
