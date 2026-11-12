/**
 * PortConflictManager
 *
 * Phase 6: Dependency & Environment Management
 *
 * Detects local port availability and resolves collision-free port assignments
 * for frontend, backend, and preview servers.
 */

import * as net from "net";

export interface PortAllocation {
  frontendPort: number;
  backendPort: number;
}

export class PortConflictManager {
  public static readonly DEFAULT_FRONTEND_PORT = 5173;
  public static readonly DEFAULT_BACKEND_PORT = 3001;

  /**
   * Checks if a given port is currently available (not in use).
   */
  public static async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();

      server.on("error", () => {
        resolve(false);
      });

      server.listen({ port, host: "127.0.0.1" }, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  /**
   * Finds the next available port starting from preferredPort.
   */
  public static async findAvailablePort(preferredPort: number, maxTries: number = 20): Promise<number> {
    for (let offset = 0; offset < maxTries; offset++) {
      const candidate = preferredPort + offset;
      const available = await this.isPortAvailable(candidate);
      if (available) {
        return candidate;
      }
    }
    // Fallback if all probed ports were busy
    return preferredPort + Math.floor(Math.random() * 1000) + 100;
  }

  /**
   * Allocates dedicated, non-conflicting ports for fullstack application execution.
   */
  public static async allocatePorts(
    preferredFrontend: number = this.DEFAULT_FRONTEND_PORT,
    preferredBackend: number = this.DEFAULT_BACKEND_PORT
  ): Promise<PortAllocation> {
    const frontendPort = await this.findAvailablePort(preferredFrontend);
    let backendPort = await this.findAvailablePort(preferredBackend);

    // Ensure frontend and backend don't collide with each other
    if (backendPort === frontendPort) {
      backendPort = await this.findAvailablePort(frontendPort + 1);
    }

    return {
      frontendPort,
      backendPort,
    };
  }
}
