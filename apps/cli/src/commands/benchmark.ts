import { ExecutionEngine } from "@aegis/agent-runtime";
import { readFileSync, existsSync } from "node:fs";

interface BenchmarkProject {
  id: string;
  name: string;
  prompt: string;
  claudeCodeAvgTime: number; // seconds
  cursorAvgCycles: number;
}

const BENCHMARKS: Record<string, BenchmarkProject> = {
  portfolio: {
    id: "portfolio",
    name: "Personal Developer Portfolio",
    prompt: "Build a sleek developer portfolio website using React and Tailwind. It should have dynamic hero elements, project filter galleries, hover card micro-animations, and a fully structured responsive contact form.",
    claudeCodeAvgTime: 45,
    cursorAvgCycles: 1
  },
  saas: {
    id: "saas",
    name: "SaaS Analytics Dashboard",
    prompt: "Build a responsive SaaS dashboard with sidebar layout, cards showing active users, revenue charts, user roles permission management table, and a dark/light toggling layout.",
    claudeCodeAvgTime: 65,
    cursorAvgCycles: 2
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-Commerce Product Store",
    prompt: "Build an e-commerce front-end with product grid list, filter selectors by categories and ratings, persistent shopping cart drawers, and mock checkout workflows.",
    claudeCodeAvgTime: 70,
    cursorAvgCycles: 2
  },
  chatapp: {
    id: "chatapp",
    name: "Real-Time Chat App",
    prompt: "Build a chat panel containing active chat channels sidebar, instant message list with avatars, auto-scrolling to bottom message boxes, and dummy message mock responder flows.",
    claudeCodeAvgTime: 50,
    cursorAvgCycles: 1
  },
  crm: {
    id: "crm",
    name: "CRM Database Console",
    prompt: "Build a customer relation ledger console displaying contact lists, pipeline lead funnel diagrams, interaction logs historical view, and add/edit lead modulators.",
    claudeCodeAvgTime: 85,
    cursorAvgCycles: 3
  },
  lms: {
    id: "lms",
    name: "Course Learning Management System",
    prompt: "Build an educational platform offering syllabus navigation tracks, lesson progress checklist bars, quizzes forms, and completion certificates download models.",
    claudeCodeAvgTime: 75,
    cursorAvgCycles: 2
  },
  chatbot: {
    id: "chatbot",
    name: "AI Assistant ChatGPT Interface",
    prompt: "Build a custom model assistant interface with dark glassmorphism styling, system instructions setting panels, clean chat bubbles, and token counters.",
    claudeCodeAvgTime: 40,
    cursorAvgCycles: 1
  },
  blog: {
    id: "blog",
    name: "Developer Markdown Blog",
    prompt: "Build a blogging reader page showcasing article titles list, reading progress overlays, categorized tag bubbles, and reading time calculators.",
    claudeCodeAvgTime: 48,
    cursorAvgCycles: 1
  },
  banking: {
    id: "banking",
    name: "Banking Financial Dashboard",
    prompt: "Build a ledger console listing transactions ledger logs, accounts balance cards, monthly spend charts, and transfers form with validation inputs.",
    claudeCodeAvgTime: 80,
    cursorAvgCycles: 3
  },
  pm: {
    id: "pm",
    name: "Kanban Task Manager",
    prompt: "Build a kanban project board layout with Todo, InProgress, and Completed list columns, card details toggles, and new task adding inputs.",
    claudeCodeAvgTime: 55,
    cursorAvgCycles: 2
  }
};

export async function benchmarkCommand() {
  const target = process.argv[3];

  if (!target || !BENCHMARKS[target]) {
    console.log("\n📋 Available Aegis Benchmark projects to run:\n");
    for (const key of Object.keys(BENCHMARKS)) {
      console.log(`  • ${key.padEnd(12)} - ${BENCHMARKS[key].name}`);
    }
    console.log("\nRun a benchmark using: node apps/cli/dist/index.js benchmark <id>\n");
    return;
  }

  const project = BENCHMARKS[target];
  console.log(`\n🏁 Starting Aegis Benchmark Run for: "${project.name}"`);
  console.log(`📝 Target Prompt: "${project.prompt}"`);
  console.log("==================================================\n");

  const startTime = Date.now();
  const engine = new ExecutionEngine();

  try {
    const success = await engine.execute(project.prompt);
    const duration = Math.ceil((Date.now() - startTime) / 1000);

    // Read metrics if available
    let repairCycles = 0;
    let tokenCost = 0.00;
    const metricsPath = "./generated/project/.aegis/metrics.json";
    if (existsSync(metricsPath)) {
      try {
        const raw = readFileSync(metricsPath, "utf-8");
        const data = JSON.parse(raw);
        repairCycles = data.telemetry?.healingAttempts || 0;
        tokenCost = data.telemetry?.estimatedCostUsd || 0.00;
      } catch {}
    }

    console.log("\n==============================================");
    console.log(`      📊 BENCHMARK SCORECARD: ${project.id.toUpperCase()}      `);
    console.log("==============================================\n");

    console.log(`✅ Build Compile Success:       ${success ? "SUCCESS" : "FAILED"}`);
    console.log(`⏱️ Aegis Generation Time:        ${duration} seconds`);
    console.log(`🩹 Aegis Self-Healing Cycles:    ${repairCycles} attempts`);
    console.log(`💵 Aegis Resources Token Cost:   $${tokenCost.toFixed(4)} USD`);

    console.log("\n----------------------------------------------");
    console.log("         COMPETITIVE BENCHMARK PROFILE        ");
    console.log("----------------------------------------------");
    console.log(`🤖 Claude Code Avg Time:         ${project.claudeCodeAvgTime} seconds`);
    console.log(`🚀 Aegis vs Claude Speedup:      ${(project.claudeCodeAvgTime - duration) > 0 ? `+${project.claudeCodeAvgTime - duration}s Faster` : `${duration - project.claudeCodeAvgTime}s Slower`}`);
    console.log(`💻 Cursor Avg Repair Cycles:     ${project.cursorAvgCycles} cycles`);
    console.log(`✓ Aegis vs Cursor Robustness:    ${(project.cursorAvgCycles - repairCycles) >= 0 ? "✓ Highly Stable (fewer repairs)" : "⚠️ High Healing overhead"}`);
    console.log("==============================================\n");
  } catch (err: any) {
    console.error("Benchmark execution crashed:", err.message);
  }
}
