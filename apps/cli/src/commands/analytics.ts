import { readFileSync, existsSync } from "node:fs";

export async function analyticsCommand() {
  const metricsPath = "./generated/project/.aegis/metrics.json";
  
  if (!existsSync(metricsPath)) {
    console.log("\n❌ No Aegis project metrics found. Run a project generation first to gather build telemetry.\n");
    return;
  }

  try {
    const raw = readFileSync(metricsPath, "utf-8");
    const data = JSON.parse(raw);

    const buildHistory = data.buildHistory || [];
    const totalRuns = buildHistory.length;
    const successfulRuns = buildHistory.filter((b: any) => b.success).length;
    const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : "0.0";
    
    const telemetry = data.telemetry || {};
    const totalTokens = telemetry.totalTokensUsed || 0;
    const estimatedCost = telemetry.estimatedCostUsd || 0.0;
    const healingAttempts = telemetry.healingAttempts || 0;
    const sandboxRuns = telemetry.sandboxRuns || 0;

    console.log("\n==============================================");
    console.log("          AEGIS ENGINEERING ANALYTICS         ");
    console.log("==============================================\n");
    
    console.log(`📊 Total Build Cycles run:      ${totalRuns}`);
    console.log(`✅ Successful Build Runs:        ${successfulRuns}`);
    console.log(`📈 Global Compile Success Rate:  ${successRate}%`);
    console.log(`🩹 Total Healing Self-Repairs:   ${healingAttempts}`);
    console.log(`🖥️ Sandbox Validation Runs:      ${sandboxRuns}`);
    console.log(`🪙 Total Tokens Utilized:        ${totalTokens.toLocaleString()}`);
    console.log(`💵 Cumulative Resource Cost:    $${estimatedCost.toFixed(4)} USD`);

    console.log("\n----------------------------------------------");
    console.log("          RECOMMENDATIONS & OPTIMIZATION      ");
    console.log("----------------------------------------------");
    if (parseFloat(successRate) < 80) {
      console.log("⚠️ Low build success rate. Consider adding stricter TS rules to naming conventions.");
    } else {
      console.log("🚀 Excellent compilation rate. Healing loops and AST context models are optimal.");
    }
    if (healingAttempts > totalRuns * 1.5) {
      console.log("⚠️ High healing cycles. Some compiler warnings are recurring. Inspect metrics history.");
    } else {
      console.log("✓ Self-healing iterations are well within boundaries.");
    }
    console.log("==============================================\n");
  } catch (err: any) {
    console.error("Failed to parse engineering metrics:", err.message);
  }
}
