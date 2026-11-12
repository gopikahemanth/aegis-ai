const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/backend/dynamic-api-generator.ts');
let content = fs.readFileSync(file, 'utf8');

const target = `      const created = await (prisma as any).invoice.create({
        data: invoiceData,
      });

      if (Array.isArray(lineItemsData) && lineItemsData.length > 0) {
        const itemDelegate = ('invoiceItem' in prisma) ? 'invoiceItem' : (('lineItem' in prisma) ? 'lineItem' : null);
        if (itemDelegate) {
          for (const item of lineItemsData) {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
            await (prisma as any)[itemDelegate].create({
              data: {
                invoiceId: created.id,
                description: item.description || 'Service',
                quantity: qty,
                unitPrice: unitPrice,
                amount: Math.round(qty * unitPrice * 100) / 100,
              }
            }).catch(() => null);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: created,
        ...created
      });`;

const replacement = `      const createdInvoice = await (prisma as any).invoice.create({
        data: invoiceData,
      });

      if (Array.isArray(lineItemsData) && lineItemsData.length > 0) {
        const itemDelegate = ('invoiceItem' in prisma) ? 'invoiceItem' : (('lineItem' in prisma) ? 'lineItem' : null);
        if (itemDelegate) {
          for (const item of lineItemsData) {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
            await (prisma as any)[itemDelegate].create({
              data: {
                invoiceId: createdInvoice.id,
                description: item.description || 'Service',
                quantity: qty,
                unitPrice: unitPrice,
                amount: Math.round(qty * unitPrice * 100) / 100,
              }
            }).catch(() => null);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: createdInvoice,
        ...createdInvoice
      });`;

const normalize = (s) => s.replace(/\r\n/g, '\n');
const normContent = normalize(content);
const normTarget = normalize(target);
const normReplacement = normalize(replacement);

if (normContent.includes(normTarget)) {
  const updated = normContent.replace(normTarget, normReplacement);
  fs.writeFileSync(file, updated, 'utf8');
  console.log('✓ Successfully fixed duplicate "created" identifier in DynamicApiGenerator');
} else {
  console.error('Target not found in dynamic-api-generator.ts');
}
