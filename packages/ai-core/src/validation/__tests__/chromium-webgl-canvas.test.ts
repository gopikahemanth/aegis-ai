import { describe, it, expect } from "vitest";
import { CHROMIUM_ARGS, isPixelBufferBlank } from "../chromium-args.js";
import { ReadOnlyBrowserValidator } from "../read-only-browser-validator.js";

describe("Headless Chromium WebGL & Canvas Validation (Phase 1 Step 5)", () => {
  it("exports all required Chromium launch arguments for SwiftShader WebGL", () => {
    const requiredArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--enable-webgl",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ];

    for (const arg of requiredArgs) {
      expect(CHROMIUM_ARGS).toContain(arg);
    }
  });

  it("detects blank canvas pixel buffer (variance < threshold)", () => {
    // 200x200 totally black (all 0)
    const blackBuffer = new Uint8Array(200 * 200 * 4);
    expect(isPixelBufferBlank(blackBuffer)).toBe(true);

    // 200x200 uniform color (all identical RGBA)
    const uniformBuffer = new Uint8Array(200 * 200 * 4);
    for (let i = 0; i < uniformBuffer.length; i += 4) {
      uniformBuffer[i] = 120;     // R
      uniformBuffer[i + 1] = 120; // G
      uniformBuffer[i + 2] = 120; // B
      uniformBuffer[i + 3] = 255; // A
    }
    expect(isPixelBufferBlank(uniformBuffer)).toBe(true);
  });

  it("detects non-blank canvas pixel buffer with diverse rendered pixels", () => {
    // 200x200 buffer with gradient / diverse content
    const gradientBuffer = new Uint8Array(200 * 200 * 4);
    for (let i = 0; i < gradientBuffer.length; i += 4) {
      gradientBuffer[i] = (i % 256);
      gradientBuffer[i + 1] = ((i * 3) % 256);
      gradientBuffer[i + 2] = ((i * 7) % 256);
      gradientBuffer[i + 3] = 255;
    }
    expect(isPixelBufferBlank(gradientBuffer)).toBe(false);
  });

  it("treats WebGL context creation and renderer notes as non-fatal warnings", () => {
    const samples = [
      "Could not create a WebGL context, VENDOR = 0xffff, DEVICE = 0xffff",
      "A WebGL context could not be created.",
      "WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost",
      "THREE.WebGLRenderer: Error creating WebGL context.",
    ];

    for (const s of samples) {
      expect(ReadOnlyBrowserValidator.NON_FATAL_WEBGL_REGEX.test(s)).toBe(true);
    }
  });
});
