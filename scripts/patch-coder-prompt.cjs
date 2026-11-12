const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/agents/coder-agent.ts');
let content = fs.readFileSync(file, 'utf8');
const lines = content.split(/\r?\n/);

let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('NEVER use hardcoded Tailwind color classes')) {
    lines.splice(i + 1, 0, '      * NEVER declare or shadow imported components locally (e.g. NEVER write "const Button = ..." or "function Card(...)" when Button or Card is already imported from "../design-system"). Doing so causes TS2440 duplicate identifier compiler errors.');
    found = true;
    break;
  }
}

if (found) {
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('✓ Successfully added rule to coder-agent.ts');
} else {
  console.log('Line not found');
}
