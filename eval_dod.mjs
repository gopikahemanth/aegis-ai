import fs from 'node:fs';
import path from 'node:path';
import { DefinitionOfDone } from './packages/ai-core/dist/validation/definition-of-done.js';

const projectDir = path.resolve('projects/campus-advisor-bot-v3');
const contract = JSON.parse(fs.readFileSync(path.join(projectDir, '.aegis', 'architecture-contract.json'), 'utf8'));

const dod = new DefinitionOfDone();
const result = dod.validate(projectDir, contract.requiredFeatures || [], true);
console.log('--- DEFINITION OF DONE RESULT ---');
console.log('Score:', result.score);
console.log('Passed:', result.passed);
for (const c of result.criteria) {
  console.log(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.name}: ${c.detail}`);
}
