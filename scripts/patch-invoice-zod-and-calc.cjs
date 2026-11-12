const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/backend/dynamic-api-generator.ts');
let content = fs.readFileSync(file, 'utf8');

const target = `      // Support nested items array for order/cart models
      if (/(order|checkout|cart|sale)/i.test(model.name)) {
        content += \`  items: z.array(z.object({\\n\`;
        content += \`    productId: z.string().optional(),\\n\`;
        content += \`    ceramicPieceId: z.string().optional(),\\n\`;
        content += \`    id: z.string().optional(),\\n\`;
        content += \`    quantity: z.number().int().positive().default(1),\\n\`;
        content += \`    price: z.number().nonnegative().optional(),\\n\`;
        content += \`  })).optional(),\\n\`;
      }`;

const replacement = `      // Support nested items array for order/cart models
      if (/(order|checkout|cart|sale)/i.test(model.name)) {
        content += \`  items: z.array(z.object({\\n\`;
        content += \`    productId: z.string().optional(),\\n\`;
        content += \`    ceramicPieceId: z.string().optional(),\\n\`;
        content += \`    id: z.string().optional(),\\n\`;
        content += \`    quantity: z.number().int().positive().default(1),\\n\`;
        content += \`    price: z.number().nonnegative().optional(),\\n\`;
        content += \`  })).optional(),\\n\`;
      }

      // Support nested line items array and taxRate for invoice/bill models
      if (/(invoice|bill)/i.test(model.name)) {
        content += \`  lineItems: z.array(z.object({\\n\`;
        content += \`    description: z.string().optional(),\\n\`;
        content += \`    quantity: z.number().positive().default(1),\\n\`;
        content += \`    unitPrice: z.number().nonnegative().optional(),\\n\`;
        content += \`    amount: z.number().nonnegative().optional(),\\n\`;
        content += \`  })).optional(),\\n\`;
        content += \`  items: z.array(z.any()).optional(),\\n\`;
        content += \`  taxRate: z.number().nonnegative().optional(),\\n\`;
      }`;

const normalize = (s) => s.replace(/\r\n/g, '\n');
let normContent = normalize(content);
const normTarget = normalize(target);
const normReplacement = normalize(replacement);

if (normContent.includes(normTarget)) {
  normContent = normContent.replace(normTarget, normReplacement);
  fs.writeFileSync(file, normContent, 'utf8');
  console.log('✓ Successfully added invoice lineItems & taxRate to dynamic-api-generator validator');
} else {
  console.error('Target not found');
}
