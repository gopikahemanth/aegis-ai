const { spawn } = require('child_process');
const path = require('path');

const PROMPT = `Build a completely new full-stack aerospace operations website named STRATOS AVIONICS V36. Create a distinctive, production-quality aerospace flight operations platform featuring aircraft fleet monitoring, telemetry, avionics sensors, flight schedules, mission planning, NOTAM management, maintenance records, and safety incidents. Requirements: - Use the existing Aegis AI frontend-first generation pipeline and approval checkpoints. - Create a distinctive, professional aerospace UI with responsive layouts and meaningful interactions. - Implement real backend APIs and PostgreSQL persistence where required by the architecture. - Verify every canonical route in real Chromium and test observable state changes. - Verify API workflows, database mutations through read-back, and production builds. - Preserve the original interaction provenance baseline. Never reset it to improve NIR. - Enforce STRICT_UNASSISTED certification. Do not misclassify injected handlers as native. - Generate reports using actual validators. Never fabricate evidence or manually edit certification results. - If verification fails, preserve the evidence and report the root cause honestly. Success requires a successful build, passing required browser and API checks, verified database persistence, NIR 1.00 with zero unaccounted injected handlers, and a passing strict final certification gate. Preserve all existing projects. At completion, report the actual output path, generation ID, build results, browser coverage, API and database verification, provenance counts, certification status, and remaining failures. Do not claim success without genuine verification evidence.`;

const cliPath = path.resolve(__dirname, '../apps/cli/dist/index.js');
const targetDir = 'projects/stratos-avionics-v36';

console.log('[STRATOS v36] Launching clean generation in', targetDir);
const child = spawn(process.execPath, [cliPath, 'create', PROMPT, '-o', targetDir, '-y', '--fresh'], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
});

child.on('exit', (code) => {
  console.log(`[STRATOS v36] Process exited with code ${code}`);
  process.exit(code || 0);
});
