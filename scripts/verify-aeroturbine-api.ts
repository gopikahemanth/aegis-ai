import { ApiWorkflowVerifier } from '../packages/ai-core/src/validation/api-workflow-verifier.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.resolve(__dirname, '../generated/aeroturbine-iq');
  const baseUrl = 'http://localhost:3005';
  console.log(`Running ApiWorkflowVerifier on ${projectRoot} against ${baseUrl}...`);

  const report = await ApiWorkflowVerifier.executeWorkflows(baseUrl, undefined, projectRoot);
  console.log('\n--- API Workflow Report ---');
  console.log(`Passed: ${report.passed}`);
  console.log(`Total Steps: ${report.totalSteps}`);
  console.log(`Passed Steps: ${report.passedSteps}`);
  console.log(`Failed Steps: ${report.failedSteps}`);
  console.log(`Read-only Endpoints: ${report.readOnlyEndpointsTested}`);
  console.log(`Stateful Endpoints: ${report.statefulEndpointsTested}`);
  console.log(`Mutations Verified: ${report.mutationsVerified}`);
  console.log(`Validation Tests: ${report.validationTestsPassed}`);
  console.log(`HTTP 500 Count: ${report.http500Count}`);
  console.log(`Coverage Ratio: ${report.coverageRatio * 100}%`);
  console.log(`Summary: ${report.summary}`);

  if (report.failedSteps > 0) {
    console.log('\nFailing steps:');
    report.results.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.step.method} ${r.step.path}] Expected ${r.step.expectedStatus}, got ${r.actualStatus}. Error: ${r.error || 'none'}`);
    });
  }

  process.exit(report.passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
