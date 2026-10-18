const { spawn } = require('child_process');
const path = require('path');

const PROMPT = `Create a sophisticated aeronautical telemetry and flight-operations simulation platform called STRATOS AVIONICS. Include aircraft fleet registry, flight-plan analysis, navigation waypoints, simulated flight dynamics, engine telemetry, avionics instrumentation, component health, maintenance scheduling, NOTAM notices, and flight-event investigations. Make aircraft selection update the inspector, waypoint selection update navigation metrics, simulated engine-load scenarios update telemetry, notice acknowledgement change status, and maintenance scheduling persist records retrievable from the API. Use distinctive aviation chart geometry, flight-path visualization, altitude profiles, instrument-inspired typography, technical schematics, and a high-quality aviation visual identity. Give every route a distinct composition appropriate to its operational purpose. Avoid generic dashboards, generic card grids, hero-cards-CTA layouts, and terminology or templates from hospitality, culinary publications, observatories, maritime logistics, and industrial robotics. This is a simulation and visualization platform, not real aircraft-control software. Every primary route must have a meaningful interaction contract and observable state transition. Require genuine API and PostgreSQL read-back verification, strict route-capability checks, and native-interaction provenance captured immediately after CoderAgent finishes and before sanitization.`;

const cliPath = path.resolve(__dirname, '../apps/cli/dist/index.js');
const targetDir = 'projects/stratos-avionics-v21';

console.log('[STRATOS v21] Launching generation in', targetDir);
const child = spawn(process.execPath, [cliPath, 'create', PROMPT, '-o', targetDir, '-y'], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
});

child.on('exit', (code) => {
  console.log(`[STRATOS v21] Process exited with code ${code}`);
  process.exit(code || 0);
});
