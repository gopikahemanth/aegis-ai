import React, { useState, useEffect } from "react";
import { Shell } from "./components/Shell.js";
import { ProjectDashboard } from "./components/ProjectDashboard.js";
import { GenerationStudio } from "./components/GenerationStudio.js";
import { GenerationProgressView } from "./components/GenerationProgressView.js";
import { AuthorizationModal } from "./components/AuthorizationModal.js";
import { DryRunAndDiffViewer } from "./components/DryRunAndDiffViewer.js";
import { ContractsAndArchitectureView } from "./components/ContractsAndArchitectureView.js";
import { TaskDagViewer } from "./components/TaskDagViewer.js";
import { RuntimeAndVerificationView } from "./components/RuntimeAndVerificationView.js";
import { ProductSuccessGateView } from "./components/ProductSuccessGateView.js";
import { SecurityAndAuditView } from "./components/SecurityAndAuditView.js";
import { TelemetryAndEvolutionView } from "./components/TelemetryAndEvolutionView.js";
import { ProductionReleaseView } from "./components/ProductionReleaseView.js";
import { ContinuousOperationsView } from "./components/ContinuousOperationsView.js";
import { EngineeringIntelligenceView } from "./components/EngineeringIntelligenceView.js";
import { EngineeringCommandCenter } from "./components/EngineeringCommandCenter.js";
import { SelfManagementView } from "./components/SelfManagementView.js";
import { EnterpriseGovernanceView } from "./components/EnterpriseGovernanceView.js";
import { EnterpriseCollaborationView } from "./components/EnterpriseCollaborationView.js";
import { StrategicEngineeringView } from "./components/StrategicEngineeringView.js";
import { StrategicExecutionView } from "./components/StrategicExecutionView.js";
import { EnterpriseOptimizationView } from "./components/EnterpriseOptimizationView.js";
import { EnterpriseValueView } from "./components/EnterpriseValueView.js";
import { EnterpriseResilienceView } from "./components/EnterpriseResilienceView.js";
import { EnterpriseContinuityView } from "./components/EnterpriseContinuityView.js";
import { PredictiveResilienceView } from "./components/PredictiveResilienceView.js";
import { EnterpriseReliabilityOrchestrationView } from "./components/EnterpriseReliabilityOrchestrationView.js";
import { EnterpriseDecisionIntelligenceView } from "./components/EnterpriseDecisionIntelligenceView.js";
import { EnterprisePredictivePlanningView } from "./components/EnterprisePredictivePlanningView.js";
import { EnterpriseAutonomousExecutionView } from "./components/EnterpriseAutonomousExecutionView.js";
import { EnterpriseChangeGovernanceView } from "./components/EnterpriseChangeGovernanceView.js";
import { EnterpriseEvolutionGovernanceView } from "./components/EnterpriseEvolutionGovernanceView.js";
import { EnterpriseEvolutionView } from "./components/EnterpriseEvolutionView.js";

import { EnterpriseInnovationGovernanceView } from "./components/EnterpriseInnovationGovernanceView.js";
import { EnterpriseInnovationView } from "./components/EnterpriseInnovationView.js";
import { EnterpriseProductIntelligenceView } from "./components/EnterpriseProductIntelligenceView.js";

import { EnterpriseCustomerLifecycleView } from "./components/EnterpriseCustomerLifecycleView.js";
import { EnterpriseKnowledgeView } from "./components/EnterpriseKnowledgeView.js";
import { EnterpriseKnowledgeSynthesisView } from "./components/EnterpriseKnowledgeSynthesisView.js";
import { EnterpriseKnowledgeActionView } from "./components/EnterpriseKnowledgeActionView.js";
import { EnterpriseLearningGovernanceView } from "./components/EnterpriseLearningGovernanceView.js";
import { ProductCompletionView } from "./components/ProductCompletionView.js";
import { AutonomousProductBuilderView } from "./components/AutonomousProductBuilderView.js";
import { RealProductValidationView } from "./components/RealProductValidationView.js";
import { UniversalProductBuilderView } from "./components/UniversalProductBuilderView.js";































import type {
  GenerationJob,
  ProgressEvent,
  SystemHealthReport,
  ChangePreviewReport,
  JobAuthorizationRequest,
} from "./types/control-plane-ui.js";

export function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("gym_management");

  const availableProjects = [
    { id: "gym_management", name: "Gym Management System", generation: "G2", status: "VERIFIED" },
    { id: "recipe_vault", name: "Recipe & Meal Planner", generation: "G1", status: "VERIFIED" },
    { id: "portfolio_builder", name: "Dev Portfolio & Resume", generation: "G1", status: "VERIFIED" },
  ];

  const [activeJob, setActiveJob] = useState<GenerationJob | undefined>({
    jobId: "job_active_101",
    projectId: "gym_management",
    projectPath: "/projects/gym_management",
    generationId: "gen_g2",
    requestId: "req_101",
    type: "INCREMENTAL_EVOLUTION",
    prompt: "Add dark theme styles with toggle in the navbar and preserve existing backend APIs.",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 30000).toISOString(),
    currentStage: "FINAL_VERIFICATION",
    progress: {
      totalTasks: 4,
      completedTasks: 4,
      failedTasks: 0,
      activeTasks: 0,
      percentage: 100,
    },
    pipelineState: {
      REQUIREMENT_ANALYSIS: { stage: "REQUIREMENT_ANALYSIS", status: "PASSED", timestamp: new Date().toISOString(), evidenceId: "ev_1", summary: "4 requirements identified" },
      ARCHITECTURE_RESOLUTION: { stage: "ARCHITECTURE_RESOLUTION", status: "PASSED", timestamp: new Date().toISOString(), evidenceId: "ev_2", summary: "Fullstack React + Express + Postgres locked" },
      TASK_EXECUTION: { stage: "TASK_EXECUTION", status: "PASSED", timestamp: new Date().toISOString(), evidenceId: "ev_3", summary: "Parallel generation completed in 410ms" },
      FINAL_VERIFICATION: { stage: "FINAL_VERIFICATION", status: "PASSED", timestamp: new Date().toISOString(), evidenceId: "ev_4", summary: "13/13 verification checks passed" },
    },
    contractHashes: { arch: "e157b4258648", domain: "eaf45027e749" },
    telemetry: {
      durationMs: 1420,
      totalLlmCalls: 6,
      tokensIn: 8200,
      tokensOut: 2400,
      cacheHits: 3,
      cacheMisses: 1,
      repairAttempts: 0,
      rollbackCount: 0,
      buildDurationMs: 310,
      runtimeDurationMs: 450,
      apiChecksCount: 4,
      browserChecksCount: 5,
    },
    finalStatus: "SUCCESS",
    verificationSummary: "Status: SUCCESS (10/10 checks passed). Code: PASS, Runtime: VERIFIED",
  });

  const [events, setEvents] = useState<ProgressEvent[]>([
    { eventId: "ev_1", timestamp: new Date(Date.now() - 25000).toISOString(), jobId: "job_active_101", projectId: "gym_management", generationId: "gen_g2", type: "STAGE_STARTED", stage: "REQUIREMENT_ANALYSIS" },
    { eventId: "ev_2", timestamp: new Date(Date.now() - 20000).toISOString(), jobId: "job_active_101", projectId: "gym_management", generationId: "gen_g2", type: "STAGE_COMPLETED", stage: "ARCHITECTURE_RESOLUTION" },
    { eventId: "ev_3", timestamp: new Date(Date.now() - 15000).toISOString(), jobId: "job_active_101", projectId: "gym_management", generationId: "gen_g2", type: "TASK_COMPLETED", stage: "TASK_EXECUTION" },
    { eventId: "ev_4", timestamp: new Date(Date.now() - 5000).toISOString(), jobId: "job_active_101", projectId: "gym_management", generationId: "gen_g2", type: "JOB_COMPLETED", stage: "FINAL_VERIFICATION" },
  ]);

  const [health] = useState<SystemHealthReport>({
    overall: "HEALTHY",
    timestamp: new Date().toISOString(),
    subsystems: {
      controlPlane: { name: "Control Plane", status: "HEALTHY", latencyMs: 1, lastChecked: new Date().toISOString() },
      masterPipeline: { name: "Master Pipeline", status: "HEALTHY", latencyMs: 2, lastChecked: new Date().toISOString() },
      runtime: { name: "Runtime Process Manager", status: "HEALTHY", latencyMs: 3, lastChecked: new Date().toISOString() },
    },
  });

  const [changePreview, setChangePreview] = useState<ChangePreviewReport | undefined>({
    changeType: "UI_CHANGE",
    blastRadius: "LOCAL",
    affectedContracts: [],
    filesToCreate: ["src/styles/dark.css"],
    filesToModify: ["src/App.tsx"],
    filesPreserved: ["server/routes/members.ts", "prisma/schema.prisma"],
    databaseChanges: [],
    apiChanges: [],
    authorizationRequired: false,
    risk: "LOW",
    summary: "Feedback processed as UI_EVOLUTION with blast radius LOCAL. Preserving [Backend / Controllers, Database Schema, API Contracts, Authentication].",
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentAuth] = useState<JobAuthorizationRequest | undefined>({
    id: "auth_req_101",
    operation: "REMOVE_FIELD (Member.phone)",
    category: "DESTRUCTIVE_MIGRATION",
    reason: "Destructive schema modification removes phone column. Existing member phone records will be permanently dropped.",
    targetFiles: ["prisma/schema.prisma"],
    requestedAt: new Date().toISOString(),
    status: "PENDING",
  });

  const handlePreviewChange = (prompt: string) => {
    setChangePreview({
      changeType: "UI_CHANGE",
      blastRadius: "LOCAL",
      affectedContracts: [],
      filesToCreate: ["src/styles/dark.css"],
      filesToModify: ["src/App.tsx"],
      filesPreserved: ["server/routes/members.ts", "prisma/schema.prisma"],
      databaseChanges: [],
      apiChanges: [],
      authorizationRequired: false,
      risk: "LOW",
      summary: `Change preview generated for prompt: "${prompt}". Preserving 100% backend and database layers.`,
    });
  };

  const handleRunDryRun = () => {
    setCurrentView("preview-diff");
  };

  const handleStartGeneration = (prompt: string) => {
    if (activeJob) {
      setActiveJob({
        ...activeJob,
        status: "GENERATING",
        prompt,
        progress: { ...activeJob.progress, percentage: 40 },
        currentStage: "TASK_EXECUTION",
      });
    }
    setCurrentView("progress");
  };

  const handlePauseJob = () => {
    if (activeJob) setActiveJob({ ...activeJob, status: "PAUSED" });
  };

  const handleResumeJob = () => {
    if (activeJob) setActiveJob({ ...activeJob, status: "GENERATING" });
  };

  const handleCancelJob = () => {
    if (activeJob) setActiveJob({ ...activeJob, status: "CANCELLED" });
  };

  return (
    <Shell
      currentView={currentView}
      onNavigate={(v) => setCurrentView(v)}
      selectedProjectId={selectedProjectId}
      onSelectProject={(id) => setSelectedProjectId(id)}
      availableProjects={availableProjects}
      activeJob={activeJob}
      health={health}
      onPauseJob={handlePauseJob}
      onResumeJob={handleResumeJob}
      onCancelJob={handleCancelJob}
    >
      {currentView === "dashboard" && (
        <ProjectDashboard
          project={{
            id: selectedProjectId,
            name: "Gym Management System",
            generation: "G2",
            status: "VERIFIED",
            architecture: "FULLSTACK_WEB_REACT_EXPRESS",
            domain: "Manage members, trainers, workouts, attendance, and member dashboard.",
            stack: {
              frontend: "React + Vite + Tailwind",
              backend: "Node Express REST API",
              database: "PostgreSQL",
              orm: "Prisma ORM",
              auth: "JWT Session Bearer",
            },
            featureCount: 4,
            completedFeatures: 4,
          }}
          activeJob={activeJob}
          onNavigateToStudio={() => setCurrentView("studio")}
          onNavigateToVerification={() => setCurrentView("verification")}
          onNavigateToRuntime={() => setCurrentView("runtime-api")}
        />
      )}

      {currentView === "studio" && (
        <GenerationStudio
          projectId={selectedProjectId}
          isIncremental={selectedProjectId === "gym_management"}
          onPreviewChange={handlePreviewChange}
          onRunDryRun={handleRunDryRun}
          onStartGeneration={handleStartGeneration}
          changePreview={changePreview}
        />
      )}

      {currentView === "progress" && (
        <GenerationProgressView
          job={activeJob}
          events={events}
          onPause={handlePauseJob}
          onResume={handleResumeJob}
          onCancel={handleCancelJob}
          onOpenAuthorizationModal={() => setAuthModalOpen(true)}
        />
      )}

      {currentView === "preview-diff" && (
        <DryRunAndDiffViewer
          dryRunReport={{
            jobId: "dry_run_1",
            status: "DRY_RUN_COMPLETED",
            diskMutations: 0,
            taskCount: 8,
          }}
          generationDiff={{
            fromGenerationId: "gen_g1",
            toGenerationId: "gen_g2",
            filesCreated: ["src/styles/dark.css"],
            filesModified: ["src/App.tsx"],
            filesDeleted: [],
            filesPreserved: ["server/routes/members.ts", "prisma/schema.prisma"],
            contractChanges: [],
            apiDiff: [],
            databaseDiff: [],
          }}
          onStartGeneration={() => handleStartGeneration("Generate from dry run")}
        />
      )}

      {currentView === "contracts" && <ContractsAndArchitectureView />}

      {currentView === "dag" && <TaskDagViewer />}

      {currentView === "runtime-api" && <RuntimeAndVerificationView />}

      {currentView === "verification" && <RuntimeAndVerificationView />}

      {currentView === "gate" && <ProductSuccessGateView />}

      {currentView === "repairs" && <RuntimeAndVerificationView />}

      {currentView === "security-audit" && <SecurityAndAuditView />}

      {currentView === "telemetry-evolution" && <TelemetryAndEvolutionView />}

      {currentView === "production-release" && <ProductionReleaseView />}

      {currentView === "operations" && <ContinuousOperationsView />}

      {currentView === "intelligence" && <EngineeringIntelligenceView />}

      {currentView === "command-center" && <EngineeringCommandCenter />}

      {currentView === "self-management" && <SelfManagementView />}

      {currentView === "enterprise" && <EnterpriseGovernanceView />}

      {currentView === "collaboration" && <EnterpriseCollaborationView />}

      {currentView === "strategy" && <StrategicEngineeringView />}

      {currentView === "outcomes" && <StrategicExecutionView />}

      {currentView === "optimization" && <EnterpriseOptimizationView />}

      {currentView === "economics" && <EnterpriseValueView />}

      {currentView === "resilience" && <EnterpriseResilienceView />}

      {currentView === "continuity" && <EnterpriseContinuityView />}

      {currentView === "predictive-resilience" && <PredictiveResilienceView />}

      {currentView === "reliability-orchestration" && <EnterpriseReliabilityOrchestrationView />}

      {currentView === "decision-intelligence" && <EnterpriseDecisionIntelligenceView />}

      {currentView === "predictive-planning" && <EnterprisePredictivePlanningView />}

      {currentView === "autonomous-execution" && <EnterpriseAutonomousExecutionView />}

      {currentView === "change-governance" && <EnterpriseChangeGovernanceView />}

      {currentView === "evolution-governance" && <EnterpriseEvolutionView />}


      {currentView === "innovation-governance" && <EnterpriseInnovationView />}


      {currentView === "product-intelligence" && <EnterpriseProductIntelligenceView />}

      {currentView === "customer-lifecycle" && <EnterpriseCustomerLifecycleView />}
      {currentView === "institutional-knowledge" && <EnterpriseKnowledgeView />}
      {currentView === "knowledge-synthesis" && <EnterpriseKnowledgeSynthesisView />}
      {currentView === "knowledge-action" && <EnterpriseKnowledgeActionView />}
      {currentView === "learning-governance" && <EnterpriseLearningGovernanceView />}
      {currentView === "product-completion" && <ProductCompletionView />}
      {currentView === "autonomous-builder" && <AutonomousProductBuilderView />}
      {currentView === "real-validation" && <RealProductValidationView />}
      {currentView === "universal-builder" && <UniversalProductBuilderView />}

      {/* Authorization Modal */}































      <AuthorizationModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        authorization={currentAuth}
        onApprove={() => setAuthModalOpen(false)}
        onReject={() => setAuthModalOpen(false)}
      />
    </Shell>
  );
}

export default App;
