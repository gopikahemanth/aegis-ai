const fs = require('fs');
const path = require('path');

const templatePath = path.resolve('scripts/new_route_template.txt');
let txt = fs.readFileSync(templatePath, 'utf8');

// Replace \${domainTitle} with ${domainTitle}
txt = txt.replaceAll('\\${domainTitle}', '${domainTitle}');
txt = txt.replaceAll('\\${pageHeading}', '${pageHeading}');
txt = txt.replaceAll('\\${pageSubtitle}', '${pageSubtitle}');
txt = txt.replaceAll('\\${pageTitle}', '${pageTitle}');
txt = txt.replaceAll('\\${pageTitle.toLowerCase()}', '${pageTitle.toLowerCase()}');

fs.writeFileSync(templatePath, txt, 'utf8');
console.log('Fixed interpolation in scripts/new_route_template.txt');

// Now splice it into fast-sanitizer.ts
const targetFile = path.resolve('packages/ai-core/src/governance/fast-sanitizer.ts');
const raw = fs.readFileSync(targetFile, 'utf8');
const lines = raw.split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('// Derive domain context from contract'));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('writeFileSync(pageFile, content, "utf8");'));

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find start or end boundary in fast-sanitizer.ts! startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

// Lines between startIdx and endIdx (exclusive of endIdx) are the template code
const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx);

const newContent = before.join('\n') + '\n' + txt + '\n\n    ' + after.join('\n');
fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Successfully spliced fixed template into fast-sanitizer.ts!');
