import { describe, it, expect } from "vitest";
import { SecurityVerificationEngine } from "../security-verification-engine.js";

describe("SecurityVerificationEngine", () => {
  it("detects frontend secret exposure and server/client boundary violations", () => {
    // 1. Clean frontend files
    const cleanFiles = {
      "src/components/Dashboard.tsx": "export const Dashboard = () => <div>Hello</div>;",
      "server/routes/api.ts": "const secret = process.env.JWT_SECRET;",
    };
    const cleanReport = SecurityVerificationEngine.verifyFiles(cleanFiles);
    expect(cleanReport.passed).toBe(true);

    // 2. Frontend secret leak
    const leakyFiles = {
      "src/components/Dashboard.tsx": "const secret = process.env.DATABASE_URL;",
    };
    const leakReport = SecurityVerificationEngine.verifyFiles(leakyFiles);
    expect(leakReport.passed).toBe(false);
    expect(leakReport.violations.some((v) => v.includes("SECRET_LEAK"))).toBe(true);

    // 3. Frontend importing Prisma client
    const boundaryFiles = {
      "src/components/MemberList.tsx": "import { PrismaClient } from '@prisma/client';",
    };
    const boundaryReport = SecurityVerificationEngine.verifyFiles(boundaryFiles);
    expect(boundaryReport.passed).toBe(false);
    expect(boundaryReport.violations.some((v) => v.includes("BOUNDARY_VIOLATION"))).toBe(true);
  });
});
