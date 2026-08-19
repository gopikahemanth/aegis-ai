/**
 * CanonicalFileGraph
 *
 * THE single authoritative source for every source file in a generated
 * React-Vite + Express + PostgreSQL + Prisma + JWT project.
 *
 * Rules:
 * - Every file that CoderAgent creates MUST appear here.
 * - Every local import MUST resolve to a path in this graph.
 * - No agent may invent a new path outside this graph.
 * - Semantic aliases: if agent tries to create an alias file, redirect to canonical.
 * - Boundary rules: src/** MUST NOT import server/** or @prisma/client.
 *
 * Architecture Decision (immutable):
 *   server/lib/prisma.ts  ← Prisma client (Express server only)
 *   src/**                ← React frontend (ZERO Prisma access)
 */

export type FileCategory =
  | "frontend-page"
  | "frontend-component"
  | "frontend-service"
  | "frontend-hook"
  | "frontend-lib"
  | "frontend-types"
  | "backend-entry"
  | "backend-controller"
  | "backend-route"
  | "backend-service"
  | "backend-middleware"
  | "backend-lib"
  | "schema"
  | "config";

export interface CanonicalFileEntry {
  /** Exact canonical relative path — the ONLY valid path for this file */
  canonicalPath: string;
  /** Human label for logs and debugging */
  semanticRole: string;
  /** Alternative names / bad paths that must NOT create new files — redirect to canonicalPath */
  semanticAliases: string[];
  /** Symbols this file MUST export */
  requiredExports: string[];
  /** Canonical paths this file is allowed to import from (local paths only) */
  allowedImports: string[];
  /** Canonical paths that MUST NOT import this file */
  forbiddenImporters?: string[];
  /** Task title that owns creation of this file */
  taskOwner?: string;
  /** Whether this file is required (missing = error) or optional */
  required: boolean;
  category: FileCategory;
}

/** Boundary layer definitions */
export interface BoundaryRule {
  layer: string;
  glob: string;
  forbidden: string[];
  reason: string;
}

export const BOUNDARY_RULES: BoundaryRule[] = [
  {
    layer: "Frontend",
    glob: "src/**",
    forbidden: ["@prisma/client", "server/", "prisma/"],
    reason: "Frontend (src/**) must never access the database layer directly. Use src/services/api.ts.",
  },
  {
    layer: "Schema",
    glob: "prisma/**",
    forbidden: ["src/", "server/"],
    reason: "Prisma schema is a configuration file only — no TypeScript imports.",
  },
];

/**
 * Full canonical 39-file graph for the Resume Keyword Scanner project.
 * This list is exhaustive. Any file not in this graph is UNAUTHORIZED.
 */
export const CANONICAL_FILES: CanonicalFileEntry[] = [
  // ─── Config ────────────────────────────────────────────────────────────────
  {
    canonicalPath: "package.json",
    semanticRole: "Package Manifest",
    semanticAliases: [],
    requiredExports: [],
    allowedImports: [],
    required: true,
    category: "config",
  },
  {
    canonicalPath: "tsconfig.json",
    semanticRole: "TypeScript Config",
    semanticAliases: ["tsconfig.node.json"],
    requiredExports: [],
    allowedImports: [],
    required: true,
    category: "config",
  },
  {
    canonicalPath: "vite.config.ts",
    semanticRole: "Vite Config",
    semanticAliases: ["vite.config.js"],
    requiredExports: [],
    allowedImports: [],
    required: true,
    category: "config",
  },
  {
    canonicalPath: "prisma/schema.prisma",
    semanticRole: "Prisma Schema",
    semanticAliases: ["schema.prisma"],
    requiredExports: [],
    allowedImports: [],
    required: true,
    category: "schema",
  },

  // ─── Backend Entry ─────────────────────────────────────────────────────────
  {
    canonicalPath: "server/index.ts",
    semanticRole: "Express Entry Point",
    semanticAliases: ["server/app.ts", "server/server.ts", "server/main.ts"],
    requiredExports: [],
    allowedImports: [
      "server/routes/scan.routes",
      "server/routes/auth.routes",
    ],
    required: true,
    category: "backend-entry",
  },

  // ─── Backend Lib ───────────────────────────────────────────────────────────
  {
    canonicalPath: "server/lib/prisma.ts",
    semanticRole: "Prisma Client Instance",
    semanticAliases: [
      "src/lib/prisma.ts",
      "lib/prisma.ts",
      "prisma.ts",
      "server/prisma.ts",
      "server/db.ts",
    ],
    requiredExports: ["prisma"],
    allowedImports: ["@prisma/client"],
    // Frontend MUST NOT import this — enforced by boundary rules
    forbiddenImporters: ["src/"],
    required: true,
    category: "backend-lib",
  },
  {
    canonicalPath: "server/db/index.ts",
    semanticRole: "Database Module Index",
    semanticAliases: [
      "server/db.ts",
      "server/db/index.ts",
      "server/db/prisma.ts",
      "server/lib/db.ts",
      "server/db",
      "./db",
    ],
    requiredExports: ["prisma"],
    allowedImports: ["server/lib/prisma"],
    required: true,
    category: "backend-lib",
  },

  // ─── Backend Routes ────────────────────────────────────────────────────────
  {
    canonicalPath: "server/routes/scan.routes.ts",
    semanticRole: "Scan Routes",
    semanticAliases: [
      "server/routes/analysis.routes.ts",
      "server/routes/resume.routes.ts",
      "server/routes/scan.ts",
      "server/routes/scan",
      "server/routes/scanRoutes.ts",
      "server/routes/scanRoutes",
      "./routes/scan",
      "./routes/scan.ts",
      "./routes/scanRoutes",
      "./routes/scanRoutes.ts",
      "../routes/scan",
      "../routes/scanRoutes",
      "routes/scan",
      "scan.routes.ts",
      "scanRoutes.ts",
      "scanRoutes",
    ],
    requiredExports: ["router"],
    allowedImports: [
      "server/controllers/scan.controller",
      "server/middleware/auth.middleware",
      "server/middleware/upload.middleware",
    ],
    required: true,
    category: "backend-route",
  },
  {
    canonicalPath: "server/routes/auth.routes.ts",
    semanticRole: "Auth Routes",
    semanticAliases: [
      "server/routes/user.routes.ts",
      "server/routes/login.ts",
      "server/routes/auth.ts",
      "server/routes/auth",
      "server/routes/authRoutes.ts",
      "server/routes/authRoutes",
      "./routes/auth",
      "./routes/auth.ts",
      "./routes/authRoutes",
      "./routes/authRoutes.ts",
      "../routes/auth",
      "../routes/authRoutes",
      "routes/auth",
      "auth.routes.ts",
      "authRoutes.ts",
      "authRoutes",
      "auth.ts",
    ],
    requiredExports: ["router"],
    allowedImports: ["server/controllers/auth.controller"],
    required: true,
    category: "backend-route",
  },

  // ─── Backend Controllers ───────────────────────────────────────────────────
  {
    canonicalPath: "server/controllers/scan.controller.ts",
    semanticRole: "Scan Controller",
    semanticAliases: [
      "server/controllers/analysis.controller.ts",
      "server/controllers/resume.controller.ts",
      "server/controllers/ScanController.ts",
    ],
    requiredExports: ["uploadResume", "analyzeResume", "getScanHistory"],
    allowedImports: [
      "server/services/pdf.service",
      "server/services/keyword.service",
      "server/lib/prisma",
      "server/middleware/upload.middleware",
    ],
    required: true,
    category: "backend-controller",
  },
  {
    canonicalPath: "server/controllers/auth.controller.ts",
    semanticRole: "Auth Controller",
    semanticAliases: [
      "server/controllers/AuthController.ts",
      "server/controllers/user.controller.ts",
      "../models/user.model",
      "../config/env",
      "./config/env",
      "../config/db",
    ],
    requiredExports: ["login", "register"],
    allowedImports: ["server/lib/prisma"],
    required: true,
    category: "backend-controller",
  },

  // ─── Backend Services ──────────────────────────────────────────────────────
  {
    canonicalPath: "server/services/pdf.service.ts",
    semanticRole: "PDF Extraction Service",
    semanticAliases: [
      "server/services/pdfService.ts",
      "server/services/pdf-parser.ts",
      "server/services/pdfParser.ts",
      "src/services/pdfService.ts",
    ],
    requiredExports: ["extractTextFromPdf"],
    allowedImports: [],
    required: true,
    category: "backend-service",
  },
  {
    canonicalPath: "server/services/keyword.service.ts",
    semanticRole: "Keyword Analysis Service",
    semanticAliases: [
      "server/services/nlp.service.ts",
      "server/services/nlp.service",
      "server/services/nlpService.ts",
      "server/services/nlpService",
      "server/services/keywordService.ts",
      "server/services/analysis.service.ts",
      "server/services/analysisService.ts",
      "server/services/analysis.engine.ts",
      "server/services/analysis.engine",
      "server/services/analysisEngine.ts",
      "server/services/analysisEngine",
      "../services/analysis.engine",
      "../services/analysis.engine.ts",
      "./services/analysis.engine",
      "services/analysis.engine",
      "analysis.engine.ts",
      "analysis.engine",
      "server/services/matcher.service.ts",
      "server/services/scoring.service.ts",
      "src/services/analysisService.ts",
    ],
    requiredExports: ["analyzeKeywords", "calculateMatchScore"],
    allowedImports: [],
    required: true,
    category: "backend-service",
  },

  // ─── Backend Middleware ────────────────────────────────────────────────────
  {
    canonicalPath: "server/middleware/auth.middleware.ts",
    semanticRole: "JWT Auth Middleware",
    semanticAliases: ["server/middleware/authenticate.ts", "server/middleware/jwtMiddleware.ts"],
    requiredExports: ["authMiddleware"],
    allowedImports: ["server/lib/prisma"],
    required: true,
    category: "backend-middleware",
  },
  {
    canonicalPath: "server/middleware/upload.middleware.ts",
    semanticRole: "Multer Upload Middleware",
    semanticAliases: ["server/middleware/multer.ts", "server/middleware/fileUpload.ts"],
    requiredExports: ["uploadMiddleware", "MulterRequest"],
    allowedImports: [],
    required: true,
    category: "backend-middleware",
  },
  {
    canonicalPath: "server/middleware/errorHandler.ts",
    semanticRole: "Express Error Handler Middleware",
    semanticAliases: [
      "server/middleware/errorHandler.ts",
      "server/middleware/errorHandler",
      "./middleware/errorHandler",
      "../middleware/errorHandler",
      "server/middleware/error-handler.ts",
      "server/middleware/error.ts",
    ],
    requiredExports: ["errorHandler"],
    allowedImports: [],
    required: true,
    category: "backend-middleware",
  },

  // ─── Frontend Root ─────────────────────────────────────────────────────────
  {
    canonicalPath: "src/main.tsx",
    semanticRole: "React Entry Point",
    semanticAliases: ["src/index.tsx", "src/index.ts"],
    requiredExports: [],
    allowedImports: ["src/App"],
    required: true,
    category: "frontend-page",
  },
  {
    canonicalPath: "src/App.tsx",
    semanticRole: "App Root",
    semanticAliases: ["src/app/App.tsx", "src/Application.tsx"],
    requiredExports: ["default"],
    allowedImports: ["src/routes"],
    required: true,
    category: "frontend-page",
  },
  {
    canonicalPath: "src/routes.tsx",
    semanticRole: "Route Config",
    semanticAliases: [
      "src/router.tsx",
      "src/app/routes.tsx",
      "src/routing.tsx",
      "src/routes.ts",
      "src/routes/index.ts",
      "src/routes/index.tsx",
      "./routes",
    ],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/analyzer/AnalyzePage",
      "src/features/dashboard/DashboardPage",
      "src/features/auth/LoginPage",
      "src/features/auth/RegisterPage",
      "src/shared/components/Layout",
    ],
    required: true,
    category: "frontend-page",
  },

  // ─── Frontend Pages ────────────────────────────────────────────────────────
  {
    canonicalPath: "src/features/analyzer/AnalyzePage.tsx",
    semanticRole: "Analyze Page",
    semanticAliases: [
      "src/features/analyzer/Analyze.tsx",
      "src/features/analysis/AnalyzePage.tsx",
      "src/pages/AnalyzePage.tsx",
      "src/pages/Analyze.tsx",
      "src/pages/Scanner.tsx",
      "src/features/scanner/ScanPage.tsx",
      "src/features/upload/UploadPage.tsx",
      "src/features/analyzer/AnalyzerPage.tsx",
      "src/features/analysis/AnalysisPage.tsx",
      "ResumeAnalyzer.tsx",
    ],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/upload/components/UploadForm",
      "src/features/analyzer/components/ResultsPanel",
      "src/features/parser/hooks/useResumeUpload",
      "src/services/api",
      "src/shared/components/Layout",
    ],
    required: true,
    category: "frontend-page",
  },
  {
    canonicalPath: "src/features/dashboard/DashboardPage.tsx",
    semanticRole: "Dashboard Page",
    semanticAliases: [
      "src/features/dashboard/Dashboard.tsx",
      "src/pages/DashboardPage.tsx",
      "src/pages/Dashboard.tsx",
      "DashboardView.tsx",
      "ScanDashboard.tsx",
      "src/features/analysis/DashboardPage.tsx",
      "./pages/Dashboard",
      "./pages/DashboardPage",
      "./pages/Login",
      "./pages/AnalysisResult",
      "./pages/NotFound",
      "./components/ProtectedRoute",
    ],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/dashboard/components/MatchDashboard",
      "src/features/dashboard/hooks/useDashboardData",
      "src/shared/components/Layout",
    ],
    required: true,
    category: "frontend-page",
  },
  {
    canonicalPath: "src/features/auth/LoginPage.tsx",
    semanticRole: "Login Page",
    semanticAliases: [
      "src/pages/Login.tsx",
      "src/features/auth/Login.tsx",
      "./pages/Login",
      "./pages/Login.tsx",
      "./pages/LoginPage",
      "./Login",
      "../pages/Login",
    ],
    requiredExports: ["default"],
    allowedImports: ["src/services/api", "src/hooks/useAuth"],
    required: true,
    category: "frontend-page",
  },
  {
    canonicalPath: "src/features/auth/RegisterPage.tsx",
    semanticRole: "Register Page",
    semanticAliases: [
      "src/pages/Register.tsx",
      "src/features/auth/Register.tsx",
      "src/features/auth/SignupPage.tsx",
      "./pages/Register",
      "./pages/Register.tsx",
      "./Register",
    ],
    requiredExports: ["default"],
    allowedImports: ["src/services/api", "src/hooks/useAuth"],
    required: true,
    category: "frontend-page",
  },

  // ─── Frontend Components ───────────────────────────────────────────────────
  {
    canonicalPath: "src/features/dashboard/components/MatchDashboard.tsx",
    semanticRole: "Match Dashboard",
    semanticAliases: [
      "src/features/analysis/components/MatchDashboard.tsx",
      "AnalysisDashboard.tsx",
      "MatchOverview.tsx",
      "ScanSummaryCard.tsx",
      "ScanHistoryTable.tsx",
      "ScanHistoryTable",
      "./components/ScanHistoryTable",
      "../components/ScanHistoryTable",
      "src/features/dashboard/components/ScanHistoryTable.tsx",
      "src/features/dashboard/components/ScanHistoryTable",
      "src/components/MatchDashboard.tsx",
    ],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/dashboard/components/ScoreGauge",
      "src/shared/components/Badge",
      "src/shared/components/Card",
      "src/types/index",
    ],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/features/dashboard/components/ScoreGauge.tsx",
    semanticRole: "Score Gauge",
    semanticAliases: [
      "./ScoreGauge",
      "ScoreGauge",
      "ScoreGauge.tsx",
      "./ScoreGauge.tsx",
      "VulnerabilityMetrics.tsx",
      "VulnerabilityMetrics",
      "./components/VulnerabilityMetrics",
      "../components/VulnerabilityMetrics",
      "src/features/dashboard/components/VulnerabilityMetrics.tsx",
      "src/features/dashboard/components/VulnerabilityMetrics",
      "MetricsOverview",
      "MetricsOverview.tsx",
      "./components/MetricsOverview",
      "../components/MetricsOverview",
      "src/features/dashboard/components/MetricsOverview.tsx",
      "src/shared/components/MatchScoreDial.tsx",
      "ScoreCard.tsx",
      "ScoreRadar.tsx",
      "ScoreRadarChart.tsx",
      "ScoreVisualizer.tsx",
      "MatchScoreDial.tsx",
      "MetricCharts.tsx",
      "MetricCharts",
      "MetricChart.tsx",
      "MetricChart",
      "src/features/dashboard/components/MetricCharts.tsx",
      "src/features/dashboard/components/MetricCharts",
      "src/features/dashboard/components/MetricChart.tsx",
      "src/features/dashboard/components/MatchScoreDial.tsx",
      "src/features/analysis/components/ScoreGauge.tsx",
    ],
    requiredExports: ["default"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/features/analyzer/components/KeywordCloud.tsx",
    semanticRole: "Keyword Cloud",
    semanticAliases: ["KeywordList.tsx", "KeywordBadges.tsx"],
    requiredExports: ["default"],
    allowedImports: ["src/shared/components/Badge", "src/types/index"],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/features/analyzer/components/ResultsPanel.tsx",
    semanticRole: "Results Panel",
    semanticAliases: ["AnalysisResults.tsx", "ResultsView.tsx"],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/analyzer/components/KeywordCloud",
      "src/shared/components/Badge",
      "src/shared/components/Card",
      "src/types/index",
    ],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/features/upload/components/UploadForm.tsx",
    semanticRole: "Upload Form",
    semanticAliases: [
      "src/features/parser/UploadDropzone",
      "src/features/parser/UploadDropzone.tsx",
      "UploadDropzone",
      "UploadDropzone.tsx",
      "src/features/upload/components/FileDropzone.tsx",
      "src/features/analyzer/components/FileDropzone.tsx",
      "src/features/analyzer/components/FileDropzone",
      "src/features/upload/UploadForm.tsx",
      "src/components/UploadForm.tsx",
      "ResumeDropzone.tsx",
      "PDFUploader.tsx",
      "FileDropzone.tsx",
      "FileDropzone",
      "UploadDropzone.tsx",
      "src/features/upload/UploadDropzone.tsx",
      "src/components/UploadDropzone.tsx",
    ],
    requiredExports: ["default"],
    allowedImports: [
      "src/features/parser/hooks/useResumeUpload",
      "src/shared/components/Spinner",
    ],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/Layout.tsx",
    semanticRole: "Layout Shell",
    semanticAliases: ["Layout.tsx", "AppLayout.tsx", "src/components/Layout.tsx"],
    requiredExports: ["default"],
    allowedImports: ["src/shared/components/Navbar"],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/Navbar.tsx",
    semanticRole: "Navbar",
    semanticAliases: ["Navigation.tsx", "Header.tsx", "Nav.tsx"],
    requiredExports: ["default"],
    allowedImports: ["src/hooks/useAuth"],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/Badge.tsx",
    semanticRole: "Badge",
    semanticAliases: ["Chip.tsx", "Tag.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/Card.tsx",
    semanticRole: "Card",
    semanticAliases: [
      "Container.tsx",
      "Panel.tsx",
      "ScanCard.tsx",
      "ScanCard",
      "./components/ScanCard",
      "../components/ScanCard",
      "src/features/dashboard/components/ScanCard.tsx",
      "src/features/dashboard/components/ScanCard",
      "ScanHistoryCard.tsx",
      "ScanSummaryCard.tsx",
      "src/components/Card.tsx",
      "shared/components/Card",
      "../../../shared/components/Card",
      "../../shared/components/Card",
      "./Card",
      "@/components/ui/card",
      "src/components/ui/card",
    ],
    requiredExports: ["default"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/Progress.tsx",
    semanticRole: "Progress Bar Component",
    semanticAliases: [
      "@/components/ui/progress",
      "src/components/ui/progress",
      "shared/components/Progress",
      "../../shared/components/Progress",
      "Progress.tsx",
      "ProgressBar.tsx",
    ],
    requiredExports: ["default", "Progress"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/services/scan.service.ts",
    semanticRole: "Frontend Scan API Service",
    semanticAliases: [
      "src/services/scanService.ts",
      "src/services/uploadService.ts",
      "src/services/upload.service.ts",
      "src/services/upload.service",
      "../services/scan.service",
      "../../services/scan.service",
      "../services/upload.service",
      "../../services/upload.service",
      "../services/uploadService",
      "scan.service.ts",
      "upload.service.ts",
    ],
    requiredExports: ["uploadResume", "analyzeResume", "default"],
    allowedImports: ["src/services/api"],
    required: true,
    category: "frontend-service",
  },
  {
    canonicalPath: "src/features/history/services/historyService.ts",
    semanticRole: "Scan History Service",
    semanticAliases: [
      "../services/historyService",
      "../../services/historyService",
      "src/services/historyService.ts",
      "historyService.ts",
    ],
    requiredExports: ["getHistory", "default"],
    allowedImports: ["src/services/api"],
    required: true,
    category: "frontend-service",
  },
  {
    canonicalPath: "src/design-system/components/CircularProgress.tsx",
    semanticRole: "Circular Progress Component",
    semanticAliases: [
      "@/shared/components/CircularProgress",
      "CircularProgress.tsx",
      "../components/CircularProgress",
      "../../shared/components/CircularProgress",
    ],
    requiredExports: ["default", "CircularProgress"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/LoadingSpinner.tsx",
    semanticRole: "Loading Spinner Component",
    semanticAliases: [
      "@/shared/components/LoadingSpinner",
      "LoadingSpinner.tsx",
      "../components/LoadingSpinner",
      "../../shared/components/LoadingSpinner",
      "src/shared/components/Spinner.tsx",
    ],
    requiredExports: ["default", "LoadingSpinner"],
    allowedImports: [],
    required: true,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/Spinner.tsx",
    semanticRole: "Spinner",
    semanticAliases: ["Loader.tsx", "LoadingSpinner.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/shared/components/ProgressBar.tsx",
    semanticRole: "Progress Bar",
    semanticAliases: ["LoadingBar.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },

  // ─── Design System Components ──────────────────────────────────────────────
  {
    canonicalPath: "src/design-system/tokens.ts",
    semanticRole: "Design System Tokens",
    semanticAliases: ["src/styles/tokens.ts", "src/theme/tokens.ts"],
    requiredExports: [],
    allowedImports: [],
    required: false,
    category: "frontend-lib",
  },
  {
    canonicalPath: "src/design-system/index.ts",
    semanticRole: "Design System Index",
    semanticAliases: ["src/styles/index.ts", "src/theme/index.ts"],
    requiredExports: [],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/Button.tsx",
    semanticRole: "Design System Button",
    semanticAliases: ["src/components/Button.tsx", "Button.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/GlassCard.tsx",
    semanticRole: "Design System GlassCard",
    semanticAliases: ["GlassCard.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/Skeleton.tsx",
    semanticRole: "Design System Skeleton",
    semanticAliases: ["Skeleton.tsx", "SkeletonLoader.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/design-system/components/EmptyState.tsx",
    semanticRole: "Design System EmptyState",
    semanticAliases: ["EmptyState.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },

  // ─── Additional Feature Components & Services ──────────────────────────────
  {
    canonicalPath: "src/features/dashboard/components/ScoreOverview.tsx",
    semanticRole: "Score Overview",
    semanticAliases: ["ScoreOverview.tsx"],
    requiredExports: ["default"],
    allowedImports: [],
    required: false,
    category: "frontend-component",
  },
  {
    canonicalPath: "src/features/reporting/services/pdfGeneratorService.ts",
    semanticRole: "PDF Report Generator",
    semanticAliases: ["pdfGeneratorService.ts", "pdfExportService.ts"],
    requiredExports: ["generatePdfReport"],
    allowedImports: [],
    required: false,
    category: "frontend-service",
  },

  // ─── Frontend Services ─────────────────────────────────────────────────────
  {
    canonicalPath: "src/services/api.ts",
    semanticRole: "API Client",
    semanticAliases: [
      "src/api/index.ts",
      "src/api/client.ts",
      "src/lib/api.ts",
      "src/services/apiService.ts",
      "src/services/apiClient.ts",
      "src/services/api-client.ts",
      "src/services/apiClient",
      "src/services/api-client",
      "src/services/apiService",
      "src/services/api-service",
      "@/services/apiClient",
      "@/services/api-client",
      "@/services/apiService",
      "@/services/api",
    ],
    // CRITICAL: functions must return response.data NOT AxiosResponse
    requiredExports: ["analyzeScan", "getScanHistory", "login", "register", "uploadResume"],
    allowedImports: ["src/types/index"],
    // MUST NOT import Prisma, server, or @prisma/client
    forbiddenImporters: [],
    required: true,
    category: "frontend-service",
  },

  // ─── Frontend Hooks ────────────────────────────────────────────────────────
  {
    canonicalPath: "src/features/parser/hooks/useResumeUpload.ts",
    semanticRole: "useResumeUpload hook",
    semanticAliases: [
      "useUpload.ts",
      "usePDFUpload.ts",
      "useAnalysis.ts",
      "useAnalysis",
      "../hooks/useAnalysis",
      "../../hooks/useAnalysis",
      "useResumeUpload.tsx",
    ],
    requiredExports: ["useResumeUpload"],
    allowedImports: ["src/services/api", "src/types/index"],
    required: true,
    category: "frontend-hook",
  },
  {
    canonicalPath: "src/features/dashboard/hooks/useDashboardData.ts",
    semanticRole: "useDashboardData hook",
    semanticAliases: [
      "useScans.ts",
      "useDashboard.ts",
      "useAnalysisData.ts",
      "useAnalysisData",
      "src/features/dashboard/hooks/useDashboardData.tsx",
    ],
    requiredExports: ["useDashboardData"],
    allowedImports: ["src/services/api", "src/types/index"],
    required: true,
    category: "frontend-hook",
  },
  {
    canonicalPath: "src/hooks/useAuth.ts",
    semanticRole: "useAuth hook",
    semanticAliases: ["src/hooks/useAuthentication.ts", "src/features/auth/hooks/useAuth.ts"],
    requiredExports: ["useAuth"],
    allowedImports: ["src/services/api", "src/types/index"],
    required: true,
    category: "frontend-hook",
  },

  // ─── Frontend Lib / Types ──────────────────────────────────────────────────
  {
    canonicalPath: "src/lib/queryClient.ts",
    semanticRole: "React Query Client",
    semanticAliases: ["src/queryClient.ts", "src/lib/reactQuery.ts"],
    requiredExports: ["queryClient"],
    allowedImports: [],
    required: true,
    category: "frontend-lib",
  },
  {
    canonicalPath: "src/lib/auth.ts",
    semanticRole: "Auth Helpers (frontend)",
    semanticAliases: ["src/utils/auth.ts", "src/lib/token.ts"],
    requiredExports: ["getToken", "setToken", "removeToken"],
    allowedImports: [],
    required: true,
    category: "frontend-lib",
  },
  {
    canonicalPath: "src/types/index.ts",
    semanticRole: "Shared Types",
    semanticAliases: [
      "src/types.ts",
      "src/interfaces.ts",
      "src/shared/types.ts",
      "entities/ResumeScan",
      "entities/ResumeScan.ts",
      "../../../entities/ResumeScan",
      "../../entities/ResumeScan",
      "../entities/ResumeScan",
      "ResumeScan",
      "ResumeScan.ts",
      "src/entities/ResumeScan.ts",
      "src/types/scan.ts",
      "src/types/analysis.ts",
    ],
    // Must define: MatchAnalysis, ScanHistoryItem, User, AnalysisResult
    requiredExports: ["MatchAnalysis", "ScanHistoryItem", "AnalysisResult"],
    allowedImports: [],
    required: true,
    category: "frontend-types",
  },
];

/**
 * The canonical generic API response contract for src/services/api.ts.
 * Functions MUST return unwrapped data (response.data), NOT AxiosResponse.
 */
export const CANONICAL_API_CONTRACT = `
// CANONICAL API CONTRACT (src/services/api.ts)
// CRITICAL RULES:
// 1. Functions return Promise<T> — NOT Promise<AxiosResponse<T>>
// 2. Methods are named exports — NOT methods on AxiosInstance
// 3. All requests go through axios instance with base URL from env
// 4. Auth token included via request interceptor

import axios from "axios";
import { getToken } from "../lib/auth";

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001" });
apiClient.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export const api = apiClient;

export async function login(email: string, password: string): Promise<{ token: string; user?: any }> {
  const res = await apiClient.post<{ token: string; user?: any }>("/api/auth/login", { email, password });
  return res.data;
}

export async function register(email: string, password: string): Promise<{ token: string; user?: any }> {
  const res = await apiClient.post<{ token: string; user?: any }>("/api/auth/register", { email, password });
  return res.data;
}
`.trim();

/**
 * The canonical ATS Resume Scanner API contract for src/services/api.ts.
 */
export const CANONICAL_ATS_API_CONTRACT = `
// CANONICAL ATS API CONTRACT (src/services/api.ts)
// CRITICAL RULES:
// 1. Functions return Promise<T> — NOT Promise<AxiosResponse<T>>
// 2. Methods are named exports — NOT methods on AxiosInstance
// 3. All requests go through axios instance with base URL from env
// 4. Auth token included via request interceptor

import axios from "axios";
import { getToken } from "../lib/auth";
import type { AnalysisResult, ScanHistoryItem } from "../types/index";

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001" });
apiClient.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export const api = apiClient;

export async function uploadResume(file: File, jobDescription: string): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("resume", file);
  form.append("jobDescription", jobDescription);
  const res = await apiClient.post<AnalysisResult>("/api/scans/upload", form);
  return res.data;
}

export async function analyzeScan(resumeId: string, jobDescText: string): Promise<AnalysisResult> {
  const res = await apiClient.post<AnalysisResult>("/api/scans/analyze", { resumeId, jobDescText });
  return res.data;
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  const res = await apiClient.get<ScanHistoryItem[]>("/api/scans/history");
  return res.data;
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await apiClient.post<{ token: string }>("/api/auth/login", { email, password });
  return res.data;
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  const res = await apiClient.post<{ token: string }>("/api/auth/register", { email, password });
  return res.data;
}
`.trim();

/**
 * Canonical Multer contract for upload middleware + scan controller.
 */
export const CANONICAL_MULTER_CONTRACT = `
// CANONICAL MULTER UPLOAD CONTRACT
// Use this exact typing for Express + Multer upload handlers.
// NEVER use (req: any). NEVER use @ts-ignore.

import { Request } from "express";
import multer from "multer";

// Extend Express Request to include Multer file fields
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Multer storage configuration
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted"));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
`.trim();

/**
 * CanonicalFileGraph — query interface over the CANONICAL_FILES registry.
 */
export class CanonicalFileGraph {
  private static readonly byPath = new Map<string, CanonicalFileEntry>(
    CANONICAL_FILES.map(f => [f.canonicalPath, f])
  );

  private static readonly byRole = new Map<string, CanonicalFileEntry>(
    CANONICAL_FILES.map(f => [f.semanticRole.toLowerCase(), f])
  );

  /** Get a canonical entry by its exact path */
  public static getFileByPath(path: string): CanonicalFileEntry | null {
    return CanonicalFileGraph.byPath.get(path.replace(/\\/g, "/")) ?? null;
  }

  /** Get a canonical entry by semantic role */
  public static getFileByRole(role: string): CanonicalFileEntry | null {
    return CanonicalFileGraph.byRole.get(role.toLowerCase()) ?? null;
  }

  /** All canonical file paths */
  public static getAllPaths(): string[] {
    return CANONICAL_FILES.map(f => f.canonicalPath);
  }

  /** All required file paths */
  public static getRequiredPaths(): string[] {
    return CANONICAL_FILES.filter(f => f.required).map(f => f.canonicalPath);
  }

  /**
   * Check whether a file path is authorized (in the canonical graph).
   * Config files (*.json, *.env*, *.md, *.css) are always allowed.
   */
  public static isAuthorized(path: string): boolean {
    const normalized = path.replace(/\\/g, "/");
    if (CanonicalFileGraph.byPath.has(normalized)) return true;
    // Allow design-system components and tokens
    if (normalized.startsWith("src/design-system/")) return true;
    // Allow features subdirectories
    if (normalized.startsWith("src/features/")) return true;
    // Allow server and prisma subdirectories
    if (normalized.startsWith("server/") || normalized.startsWith("prisma/")) return true;

    // Allow config/tooling/declaration/asset files
    if (/\.(json|md|env|css|scss|svg|png|jpg|ico|html|txt|yaml|yml|d\.ts)$/.test(normalized)) return true;
    if (/(vite|tailwind|postcss|tsconfig|eslint|prettier)\.config\./i.test(normalized)) return true;
    if (normalized.startsWith(".")) return true; // dotfiles (.gitignore, .env*)
    return false;

  }

  /**
   * Detect if a proposed path is a semantic duplicate of a canonical file.
   * Returns the canonical entry it should redirect to, or null if novel.
   */
  public static detectSemanticDuplicate(proposedPath: string): {
    isDuplicate: boolean;
    canonicalFile?: CanonicalFileEntry;
    reason?: string;
  } {
    const normalized = proposedPath.replace(/\\/g, "/");

    // Exact match → authorized, not a duplicate
    if (CanonicalFileGraph.byPath.has(normalized)) {
      return { isDuplicate: false };
    }

    const GENERIC_STEMS = new Set([
      "index", "types", "styles", "api", "app", "main", "utils",
      "constants", "helpers", "routes", "schema", "config", "client",
    ]);

    const proposedStem = normalized
      .split("/")
      .pop()
      ?.replace(/\.(ts|tsx|js|jsx)$/, "")
      .toLowerCase() ?? "";

    const isGenericStem = GENERIC_STEMS.has(proposedStem);

    // 1. Check ScoreRadar / ScoreVisualizer duplicate stems
    if (proposedStem.includes("scoreradar") || proposedStem.includes("scorevisualizer") || proposedStem.includes("scorechart")) {
      return {
        isDuplicate: true,
        canonicalFile: {
          canonicalPath: "src/features/scoring/components/ScoreGauge.tsx",
          semanticRole: "Score Gauge Visualizer",
          semanticAliases: ["ScoreRadar.tsx", "ScoreVisualizer.tsx", "ScoreRadarChart.tsx"],
          requiredExports: ["ScoreGauge"],
          allowedImports: [],
          required: true,
          category: "frontend-component",
        },
        reason: `"${proposedPath}" is a semantic duplicate of canonical "ScoreGauge.tsx"`,
      };
    }

    // Check all aliases
    for (const entry of CANONICAL_FILES) {
      // Check if proposedPath is a known alias
      for (const alias of entry.semanticAliases) {
        const aliasNorm = alias.replace(/\\/g, "/");
        if (aliasNorm === normalized) {
          return {
            isDuplicate: true,
            canonicalFile: entry,
            reason: `"${proposedPath}" is a registered alias for canonical file "${entry.canonicalPath}" (role: ${entry.semanticRole})`,
          };
        }
        // Stem-only alias check (no path prefix) — skip for generic stems like "index"
        if (!isGenericStem) {
          const aliasStem = aliasNorm.split("/").pop()?.replace(/\.(ts|tsx|js|jsx)$/, "").toLowerCase();
          if (aliasStem && aliasStem === proposedStem) {
            return {
              isDuplicate: true,
              canonicalFile: entry,
              reason: `"${proposedPath}" shares stem "${proposedStem}" with canonical alias of "${entry.canonicalPath}" (role: ${entry.semanticRole})`,
            };
          }
        }
      }
      // Check if stem matches the canonical path stem — skip for generic stems like "index"
      if (!isGenericStem) {
        const canonStem = entry.canonicalPath.split("/").pop()?.replace(/\.(ts|tsx|js|jsx)$/, "").toLowerCase();
        if (canonStem && canonStem === proposedStem && entry.canonicalPath !== normalized) {
          return {
            isDuplicate: true,
            canonicalFile: entry,
            reason: `"${proposedPath}" has the same component name "${proposedStem}" as canonical file "${entry.canonicalPath}"`,
          };
        }
      }
    }

    return { isDuplicate: false };
  }


  /**
   * Get the import contract context string for CoderAgent.
   * Specifies what this file is allowed to import, what it must export, etc.
   */
  public static getFileContract(canonicalPath: string): string {
    const entry = CanonicalFileGraph.getFileByPath(canonicalPath);
    if (!entry) {
      return `[CanonicalFileGraph] WARNING: "${canonicalPath}" is not in the canonical graph. Do not create this file.`;
    }

    const lines: string[] = [
      `╔════════════════════════════════════════════════════════════╗`,
      `║  CANONICAL FILE CONTRACT (IMMUTABLE)                       ║`,
      `╚════════════════════════════════════════════════════════════╝`,
      `FILE:             ${entry.canonicalPath}`,
      `SEMANTIC ROLE:    ${entry.semanticRole}`,
      ``,
      `REQUIRED EXPORTS: ${entry.requiredExports.length > 0 ? entry.requiredExports.join(", ") : "(none)"}`,
      `ALLOWED IMPORTS:  ${entry.allowedImports.length > 0 ? entry.allowedImports.join(", ") : "(none)"}`,
    ];

    if (entry.forbiddenImporters && entry.forbiddenImporters.length > 0) {
      lines.push(`FORBIDDEN IMPORTERS: ${entry.forbiddenImporters.join(", ")}`);
    }

    if (entry.semanticAliases.length > 0) {
      lines.push(``, `ALIASES (DO NOT CREATE): ${entry.semanticAliases.slice(0, 5).join(", ")}`);
    }

    // Append special contracts
    if (canonicalPath === "src/services/api.ts") {
      lines.push(``, `API RESPONSE CONTRACT:`, `  All functions MUST return response.data — NOT AxiosResponse.`);
    }
    if (canonicalPath === "server/middleware/upload.middleware.ts" || canonicalPath === "server/controllers/scan.controller.ts") {
      lines.push(``, `MULTER CONTRACT:`, `  Use MulterRequest extends Request — NEVER use (req: any) or @ts-ignore.`);
    }

    return lines.join("\n");
  }

  /**
   * Returns the full graph as a tree string for CoderAgent system prompt injection.
   */
  public static toContextString(): string {
    const groups: Record<string, CanonicalFileEntry[]> = {};
    for (const f of CANONICAL_FILES) {
      (groups[f.category] ??= []).push(f);
    }

    const lines: string[] = [
      "═══════════════════════════════════════════════════════",
      "CANONICAL PROJECT FILE GRAPH (AUTHORITATIVE — DO NOT INVENT NEW PATHS)",
      "═══════════════════════════════════════════════════════",
      "BOUNDARY RULE: src/** → FORBIDDEN to import server/**, @prisma/client",
      "BOUNDARY RULE: server/lib/prisma.ts is the ONLY Prisma client. Never src/lib/prisma.ts",
      "═══════════════════════════════════════════════════════",
    ];

    const categoryLabels: Record<string, string> = {
      "frontend-page": "Frontend Pages",
      "frontend-component": "Frontend Components",
      "frontend-service": "Frontend Services",
      "frontend-hook": "Frontend Hooks",
      "frontend-lib": "Frontend Lib",
      "frontend-types": "Frontend Types",
      "backend-entry": "Backend Entry",
      "backend-controller": "Backend Controllers",
      "backend-route": "Backend Routes",
      "backend-service": "Backend Services",
      "backend-middleware": "Backend Middleware",
      "backend-lib": "Backend Lib",
      "schema": "Schema",
      "config": "Config",
    };

    for (const [cat, label] of Object.entries(categoryLabels)) {
      const files = groups[cat];
      if (!files?.length) continue;
      lines.push(`\n[${label}]`);
      for (const f of files) {
        const req = f.required ? " (required)" : "";
        lines.push(`  ${f.canonicalPath}${req}`);
        if (f.requiredExports.length) {
          lines.push(`    exports: ${f.requiredExports.join(", ")}`);
        }
      }
    }

    lines.push("\n═══════════════════════════════════════════════════════");
    lines.push("ANY FILE NOT LISTED ABOVE IS FORBIDDEN.");
    lines.push("ANY LOCAL IMPORT NOT POINTING TO A LISTED PATH IS FORBIDDEN.");
    lines.push("═══════════════════════════════════════════════════════");

    return lines.join("\n");
  }

  /**
   * Check boundary violations:
   * - src/** importing @prisma/client → BOUNDARY_VIOLATION
   * - src/** importing server/** → BOUNDARY_VIOLATION
   */
  public static checkBoundaryViolation(sourceFile: string, importPath: string): {
    violated: boolean;
    rule?: BoundaryRule;
    message?: string;
  } {
    const src = sourceFile.replace(/\\/g, "/");
    const imp = importPath.replace(/\\/g, "/");

    if (src.startsWith("src/")) {
      for (const rule of BOUNDARY_RULES) {
        for (const forbidden of rule.forbidden) {
          if (imp.startsWith(forbidden) || imp === forbidden.replace(/\/$/, "")) {
            return {
              violated: true,
              rule,
              message: `BOUNDARY_VIOLATION: "${src}" imports "${imp}" — ${rule.reason}`,
            };
          }
        }
      }
    }

    return { violated: false };
  }
}

export interface CanonicalModuleEntry {
  path: string;
  semanticRole: string;
  requiredExports: string[];
  allowedImports: string[];
  aliases: string[];
}

export class CanonicalModuleRegistry {
  private static readonly modules: Map<string, CanonicalModuleEntry> = new Map(
    CANONICAL_FILES.map(f => [
      f.canonicalPath,
      {
        path: f.canonicalPath,
        semanticRole: f.semanticRole,
        requiredExports: f.requiredExports,
        allowedImports: f.allowedImports,
        aliases: f.semanticAliases,
      },
    ])
  );

  public static getModule(path: string): CanonicalModuleEntry | null {
    const norm = path.replace(/\\/g, "/");
    return CanonicalModuleRegistry.modules.get(norm) ?? null;
  }

  public static resolveImport(importerPath: string, requestedImport: string): { resolvedPath: string | null; canonicalEntry: CanonicalModuleEntry | null } {
    const normImporter = importerPath.replace(/\\/g, "/");
    const normImport = requestedImport.replace(/\\/g, "/");

    // 1. Exact match with canonical path
    for (const entry of CANONICAL_FILES) {
      if (entry.canonicalPath === normImport || entry.canonicalPath.endsWith(normImport)) {
        return { resolvedPath: entry.canonicalPath, canonicalEntry: CanonicalModuleRegistry.getModule(entry.canonicalPath) };
      }
    }

    // 2. Relative or alias extensionless import against importer directory
    const importerDir = normImporter.split("/").slice(0, -1).join("/");
    let candidatePath = normImport;
    if (normImport.startsWith("@/")) {
      candidatePath = `src/${normImport.slice(2)}`;
    } else if (normImport.startsWith(".")) {
      candidatePath = `${importerDir}/${normImport}`.replace(/\/+/g, "/");
    }
    const parts = candidatePath.split("/");
    const stack: string[] = [];
    for (const p of parts) {
      if (p === "." || p === "") continue;
      if (p === "..") { stack.pop(); } else { stack.push(p); }
    }
    candidatePath = stack.join("/");

    const exts = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];
    for (const ext of exts) {
      const fullCand = candidatePath + ext;
      for (const entry of CANONICAL_FILES) {
        if (entry.canonicalPath === fullCand) {
          console.log(`[CANONICAL-IMPORT-RESOLUTION] importer=${normImporter} requested=${requestedImport} resolved=${entry.canonicalPath}`);
          return { resolvedPath: entry.canonicalPath, canonicalEntry: CanonicalModuleRegistry.getModule(entry.canonicalPath) };
        }
      }
    }

    // 3. Registered semantic alias match
    for (const entry of CANONICAL_FILES) {
      for (const alias of entry.semanticAliases) {
        const normAlias = alias.replace(/\\/g, "/");
        if (normAlias === normImport || normAlias === requestedImport || normAlias.endsWith(normImport) || candidatePath.endsWith(normAlias)) {
          console.log(`[CANONICAL-IMPORT-RESOLUTION] importer=${normImporter} requested=${requestedImport} resolved=${entry.canonicalPath} via alias=${alias}`);
          return { resolvedPath: entry.canonicalPath, canonicalEntry: CanonicalModuleRegistry.getModule(entry.canonicalPath) };
        }
      }
    }

    // 4. General Types fallback resolution
    if (normImport.includes("types") || normImport.endsWith("types")) {
      for (const entry of CANONICAL_FILES) {
        if (entry.canonicalPath.includes("types")) {
          return { resolvedPath: entry.canonicalPath, canonicalEntry: CanonicalModuleRegistry.getModule(entry.canonicalPath) };
        }
      }
      return { resolvedPath: "src/types/index.ts", canonicalEntry: null };
    }

    // 5. Any src/ relative or @/ path fallback
    if (candidatePath.startsWith("src/")) {
      const resolvedWithExt = (candidatePath.endsWith(".tsx") || candidatePath.endsWith(".ts")) ? candidatePath : `${candidatePath}.tsx`;
      return { resolvedPath: resolvedWithExt, canonicalEntry: null };
    }

    return { resolvedPath: null, canonicalEntry: null };
  }
}

export function isFrameworkSupportFile(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, "/").toLowerCase();

  if (norm.endsWith(".d.ts")) return true;
  if (/(vite|tailwind|postcss|tsconfig|eslint|prettier|pnpm-workspace)\.config\./i.test(norm)) return true;
  if (/(vite|tailwind|postcss|tsconfig|eslint|prettier)\.(json|js|ts|cjs|mjs|yaml|yml)$/i.test(norm)) return true;
  if (norm === "package.json" || norm === "index.html" || norm.startsWith("public/") || norm.startsWith("src/assets/")) return true;
  if (norm.startsWith(".") || norm.startsWith(".aegis/")) return true;
  return false;
}

