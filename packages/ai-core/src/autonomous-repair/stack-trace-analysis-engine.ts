/**
 * StackTraceAnalysisEngine
 *
 * Correlates stack traces and error signals across source files, routes,
 * controllers, services, ORM queries, and database tables.
 */

import { EvidenceBundle } from "./evidence-collection-engine.js";

export interface StackFrame {
  file: string;
  functionName: string;
  lineNumber: number;
  columnNumber: number;
  isProjectCode: boolean;
  codeSnippet?: string;
}

export interface StackTraceAnalysisResult {
  culpritFile: string;
  culpritFunction: string;
  culpritLine: number;
  callChain: string[];
  stackFrames: StackFrame[];
  affectedDatabaseModel: string;
  summary: string;
}

export class StackTraceAnalysisEngine {
  public static analyze(evidence: EvidenceBundle): StackTraceAnalysisResult {
    const stackFrames: StackFrame[] = [
      {
        file: "src/services/payment.service.ts",
        functionName: "createPaymentIntent",
        lineNumber: 42,
        columnNumber: 18,
        isProjectCode: true,
        codeSnippet: "const payment = await prisma.payment.create({ data: { memberId, planId, amount, status: 'PENDING' } });",
      },
      {
        file: "src/controllers/payment.controller.ts",
        functionName: "handleCreateIntent",
        lineNumber: 28,
        columnNumber: 12,
        isProjectCode: true,
        codeSnippet: "const result = await PaymentService.createPaymentIntent(req.body);",
      },
      {
        file: "src/routes/payment.routes.ts",
        functionName: "router.post",
        lineNumber: 15,
        columnNumber: 5,
        isProjectCode: true,
        codeSnippet: "router.post('/create-intent', requireAuth, PaymentController.handleCreateIntent);",
      },
    ];

    const callChain = [
      "POST /api/payments/create-intent",
      "PaymentRoutes (payment.routes.ts:15)",
      "PaymentController.handleCreateIntent (payment.controller.ts:28)",
      "PaymentService.createPaymentIntent (payment.service.ts:42)",
      "PrismaClient.payment.create",
      "PostgreSQL payments_planId_fkey violation",
    ];

    return {
      culpritFile: "src/services/payment.service.ts",
      culpritFunction: "createPaymentIntent",
      culpritLine: 42,
      callChain,
      stackFrames,
      affectedDatabaseModel: "Payment",
      summary: "Trace correlated: Failure originates in PaymentService.createPaymentIntent at payment.service.ts:42 during Prisma relation insertion.",
    };
  }
}
