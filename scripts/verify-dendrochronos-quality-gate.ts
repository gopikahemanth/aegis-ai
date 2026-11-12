import { PageExperienceQualityGate } from '../packages/ai-core/src/validation/page-experience-quality-gate';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../generated/dendrochronos-lab');
const planPath = path.join(projectRoot, '.aegis/product-experience-plan.json');
const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : null;

console.log('Auditing project with PageExperienceQualityGate...');
const report = PageExperienceQualityGate.audit(projectRoot, plan);
console.log(`Status: ${report.status}`);
console.log(`Routes Evaluated: ${report.routesEvaluated}`);
console.log(`Routes Passed: ${report.routesPassed}`);
console.log(`Summary: ${report.summary}`);
report.routeResults.forEach(r => {
  console.log(`- Route ${r.route} (${r.pageRole}): ${r.status}`);
  if (r.violations && r.violations.length > 0) {
    console.log(`  Violations: ${r.violations.join(', ')}`);
  }
});

process.exit(report.passed ? 0 : 1);
