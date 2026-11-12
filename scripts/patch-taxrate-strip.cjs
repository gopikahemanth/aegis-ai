const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/backend/dynamic-api-generator.ts');
let content = fs.readFileSync(file, 'utf8');

const target = `      const { items: _ignoredItems, lineItems: _ignoredLines, ...invoiceBaseFields } = validated as any;`;
const replacement = `      const { items: _ignoredItems, lineItems: _ignoredLines, taxRate: _ignoredTaxRate, ...invoiceBaseFields } = validated as any;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✓ Successfully stripped taxRate from invoiceBaseFields in dynamic-api-generator.ts');
} else {
  console.error('Target not found');
}
