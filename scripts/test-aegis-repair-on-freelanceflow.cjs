const path = require('path');
const { execSync } = require('child_process');

// Require the compiled Aegis AI core engine
const { FastDeterministicSanitizer, TsSymbolRepairEngine } = require('../packages/ai-core/dist/index.js');

const projectDir = path.resolve(__dirname, '../../generated/phase-e2-freelanceflow');
console.log('Testing Aegis self-healing on:', projectDir);

// 1. Run Aegis FastDeterministicSanitizer
console.log('\n--- Step 1: Running Aegis FastDeterministicSanitizer ---');
const report = FastDeterministicSanitizer.sanitizeProject(projectDir);
console.log('Sanitization Report:', JSON.stringify(report, null, 2));

// 2. Test tsc build
console.log('\n--- Step 2: Testing TypeScript compilation ---');
try {
  const tscOut = execSync('pnpm exec tsc', { cwd: projectDir, encoding: 'utf8', stdio: 'pipe' });
  console.log('✓ TypeScript compilation passed directly!');
} catch (err) {
  const stderr = (err.stdout || '') + '\n' + (err.stderr || '');
  console.log('TSC emitted diagnostics:\n', stderr);

  console.log('\n--- Step 3: Triggering Aegis TsSymbolRepairEngine ---');
  const actions = TsSymbolRepairEngine.repair(projectDir, stderr);
  console.log(`Repaired ${actions.length} action(s):`);
  for (const act of actions) {
    console.log(`  → ${act.description}`);
  }

  // Re-verify compilation
  console.log('\n--- Step 4: Re-verifying TypeScript compilation after Aegis repair ---');
  const tscOut2 = execSync('pnpm exec tsc', { cwd: projectDir, encoding: 'utf8', stdio: 'pipe' });
  console.log('✓ TypeScript compilation passed after Aegis repair!');
}

// 3. Test full frontend build
console.log('\n--- Step 5: Full Vite production build ---');
const buildOut = execSync('pnpm run build', { cwd: projectDir, encoding: 'utf8', stdio: 'pipe' });
console.log('✓ Production build output:\n', buildOut);
console.log('\n🎉 ALL AEGIS HEALING AND BUILD GATES PASSED COMPLETELY!');
