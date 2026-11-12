import { describe, it, expect } from "vitest";
import { PortConflictManager } from "../port-conflict-manager.js";
import * as net from "net";

describe("Phase 6: PortConflictManager", () => {
  it("determines availability of an unallocated port", async () => {
    // Port 0 / high unallocated port
    const available = await PortConflictManager.isPortAvailable(49152 + Math.floor(Math.random() * 1000));
    expect(available).toBe(true);
  });

  it("detects when a port is actively in use", async () => {
    const testPort = 49200 + Math.floor(Math.random() * 500);
    const server = net.createServer();

    await new Promise<void>((resolve) => {
      server.listen(testPort, "127.0.0.1", () => resolve());
    });

    try {
      const available = await PortConflictManager.isPortAvailable(testPort);
      expect(available).toBe(false);

      // findAvailablePort should skip the busy port and return the next open one
      const openPort = await PortConflictManager.findAvailablePort(testPort);
      expect(openPort).toBeGreaterThan(testPort);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("allocates non-colliding ports for frontend and backend", async () => {
    const allocation = await PortConflictManager.allocatePorts();
    expect(allocation.frontendPort).toBeGreaterThan(0);
    expect(allocation.backendPort).toBeGreaterThan(0);
    expect(allocation.frontendPort).not.toBe(allocation.backendPort);
  });
});
