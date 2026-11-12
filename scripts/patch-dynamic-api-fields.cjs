const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/backend/dynamic-api-generator.ts');
let content = fs.readFileSync(file, 'utf8');

const target1 = `      const isInvoiceModel = /(invoice|bill)/i.test(model.name);
      const isPaymentModel = /(payment|transaction|receipt)/i.test(model.name);`;

const replacement1 = `      const isInvoiceModel = /(invoice|bill)/i.test(model.name);
      const isPaymentModel = /(payment|transaction|receipt)/i.test(model.name);
      const hasTotalField = model.fields.some(f => f.name === 'total');
      const hasTotalAmountField = model.fields.some(f => f.name === 'totalAmount');
      const hasSubtotalField = model.fields.some(f => f.name === 'subtotal');
      const hasTaxField = model.fields.some(f => f.name === 'tax');
      const hasDiscountField = model.fields.some(f => f.name === 'discount');
      const hasBalanceDueField = model.fields.some(f => f.name === 'balanceDue');`;

const target2 = `      const { items: _ignoredItems, lineItems: _ignoredLines, ...invoiceBaseFields } = validated as any;
      const invoiceData = {
        ...invoiceBaseFields,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(taxAmount * 100) / 100,
        discount: Math.round(discountAmount * 100) / 100,
        total: Math.round(totalAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        balanceDue: Math.round(balanceDue * 100) / 100,
        status: (validated as any).status || 'PENDING',
      };`;

const replacement2 = `      const { items: _ignoredItems, lineItems: _ignoredLines, ...invoiceBaseFields } = validated as any;
      const invoiceData: any = {
        ...invoiceBaseFields,
        status: (validated as any).status || 'PENDING',
      };
      \${hasSubtotalField ? \`invoiceData.subtotal = Math.round(subtotal * 100) / 100;\` : ''}
      \${hasTaxField ? \`invoiceData.tax = Math.round(taxAmount * 100) / 100;\` : ''}
      \${hasDiscountField ? \`invoiceData.discount = Math.round(discountAmount * 100) / 100;\` : ''}
      \${hasTotalField ? \`invoiceData.total = Math.round(totalAmount * 100) / 100;\` : ''}
      \${hasTotalAmountField ? \`invoiceData.totalAmount = Math.round(totalAmount * 100) / 100;\` : ''}
      \${hasBalanceDueField ? \`invoiceData.balanceDue = Math.round(balanceDue * 100) / 100;\` : ''}`;

const normalize = (s) => s.replace(/\r\n/g, '\n');
let normContent = normalize(content);
const normTarget1 = normalize(target1);
const normReplacement1 = normalize(replacement1);
const normTarget2 = normalize(target2);
const normReplacement2 = normalize(replacement2);

if (normContent.includes(normTarget1)) {
  normContent = normContent.replace(normTarget1, normReplacement1);
  console.log('✓ Replaced target 1 (model fields checks)');
}

if (normContent.includes(normTarget2)) {
  normContent = normContent.replace(normTarget2, normReplacement2);
  console.log('✓ Replaced target 2 (exact field assignment)');
}

fs.writeFileSync(file, normContent, 'utf8');
console.log('Successfully updated dynamic-api-generator.ts');
