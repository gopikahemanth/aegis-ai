import { describe, it, expect } from "vitest";
import { DependencyManifestSynthesizer } from "../dependency-manifest-synthesizer.js";

describe("Phase 6: DependencyManifestSynthesizer", () => {
  it("extracts third-party package imports while ignoring built-ins and relative paths", () => {
    const mockFiles = [
      {
        path: "src/App.tsx",
        content: `
          import React from 'react';
          import { Link } from 'react-router-dom';
          import { Check, AlertCircle } from 'lucide-react';
          import { Navbar } from './components/Navbar';
          import { api } from '@/services/api';
          import fs from 'node:fs';
          import path from 'path';
        `,
      },
      {
        path: "server/src/index.ts",
        content: `
          import express from 'express';
          import cors from 'cors';
          import { z } from 'zod';
          import { PrismaClient } from '@prisma/client';
          import http from 'http';
        `,
      },
    ];

    const detected = DependencyManifestSynthesizer.extractImportedPackages(mockFiles);

    expect(detected).toContain("react");
    expect(detected).toContain("react-router-dom");
    expect(detected).toContain("lucide-react");
    expect(detected).toContain("express");
    expect(detected).toContain("cors");
    expect(detected).toContain("zod");
    expect(detected).toContain("@prisma/client");

    // Must NOT contain node built-ins or relative/alias paths
    expect(detected).not.toContain("fs");
    expect(detected).not.toContain("node:fs");
    expect(detected).not.toContain("path");
    expect(detected).not.toContain("http");
    expect(detected).not.toContain("./components/Navbar");
    expect(detected).not.toContain("@/services/api");
  });

  it("synthesizes valid package.json and .env files", () => {
    const mockFiles = [
      {
        path: "src/components/Card.tsx",
        content: `
          import clsx from 'clsx';
          import { twMerge } from 'tailwind-merge';
        `,
      },
    ];

    const output = DependencyManifestSynthesizer.synthesize({
      projectName: "Apex Logistics",
      sourceFiles: mockFiles,
      frontendPort: 5174,
      backendPort: 3002,
    });

    // Check package.json structure
    expect(output.packageJson.name).toBe("apex-logistics");
    expect(output.packageJson.dependencies["clsx"]).toBeDefined();
    expect(output.packageJson.dependencies["tailwind-merge"]).toBeDefined();
    expect(output.packageJson.dependencies["express"]).toBeDefined();
    expect(output.packageJson.scripts["build"]).toBe("tsc && vite build");

    // Check .env
    expect(output.envContent).toContain("PORT=3002");
    expect(output.envContent).toContain("VITE_PORT=5174");
    expect(output.envContent).toContain("VITE_API_URL=http://localhost:3002/api");
    expect(output.envContent).toContain("DATABASE_URL=");
  });
});
