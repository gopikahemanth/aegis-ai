const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('packages/ai-core/src/governance/fast-sanitizer.ts');
const raw = fs.readFileSync(targetFile, 'utf8');
const lines = raw.split(/\r?\n/);

const startIdx = 1792; // 0-indexed: line 1793
const endIdx = 1956;   // 0-indexed: line 1957

if (!lines[startIdx].includes('const content = `import React')) {
  console.error('Mismatch at startIdx! Found:', lines[startIdx]);
  process.exit(1);
}
if (!lines[endIdx].trim().startsWith('`;')) {
  console.error('Mismatch at endIdx! Found:', lines[endIdx]);
  process.exit(1);
}

const templateTxt = fs.readFileSync(path.resolve('scripts/new_route_template.txt'), 'utf8');

const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx + 1);

const result = before.join('\n') + '\n' + templateTxt + '\n' + after.join('\n');
fs.writeFileSync(targetFile, result, 'utf8');
console.log('Successfully spliced new route template into fast-sanitizer.ts!');
