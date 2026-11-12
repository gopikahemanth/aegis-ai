import { ApiWorkflowVerifier } from '../packages/ai-core/src/validation/api-workflow-verifier';
import path from 'path';

async function main() {
  const projectRoot = path.resolve(__dirname, '../generated/dendrochronos-lab');
  const baseUrl = 'http://localhost:5000';
  console.log(`Running ApiWorkflowVerifier on ${projectRoot} against ${baseUrl}...`);

  const report = await ApiWorkflowVerifier.executeWorkflows(baseUrl, undefined, projectRoot);
  console.log('\n--- API Workflow Report ---');
  console.log(`Passed: ${report.passed}`);
  console.log(`Total Steps: ${report.totalSteps}`);
  console.log(`Passed Steps: ${report.passedSteps}`);
  console.log(`Failed Steps: ${report.failedSteps}`);
  console.log(`Validation Tests Passed: ${report.validationTestsPassed}`);
  console.log(`Mutations Verified: ${report.mutationsVerified}`);
  console.log(`HTTP 500 Count: ${report.http500Count}`);
  console.log(`Summary: ${report.summary}`);

  if (report.failedSteps > 0) {
    console.log('\nFailing steps:');
    report.results.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.method} ${r.path}] Expected ${r.expectedStatus}, got ${r.actualStatus}. Error: ${r.errorMessage || 'none'}`);
    });
  }

  process.exit(report.passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
