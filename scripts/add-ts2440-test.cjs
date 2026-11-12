const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/healing/__tests__/error-root-cause-healing.test.ts');
let content = fs.readFileSync(file, 'utf8');

const test8 = `  it("8. TsSymbolRepairEngine repairs TS2440 import collision with redundant local declaration", () => {
    const filePath = join(testDir, "src", "pages", "FinancialReportingSuite.tsx");
    const code = \`import React, { useState } from 'react';
import { Button, GlassCard } from '../design-system';

const Button = (props: any) => <button className="px-3 py-1.5" {...props}>{props.children}</button>;

export const FinancialReportingSuite = () => {
  return <div><Button>Export</Button></div>;
};
\`;
    writeFileSync(filePath, code, "utf8");

    const diagnostic = \`src/pages/FinancialReportingSuite.tsx(2,10): error TS2440: Import declaration conflicts with local declaration of 'Button'.\`;
    const actions = TsSymbolRepairEngine.repair(testDir, diagnostic);

    expect(actions.length).toBeGreaterThan(0);
    const updatedCode = readFileSync(filePath, "utf8");
    // Redundant local declaration is removed so canonical design-system Button is used
    expect(updatedCode).not.toContain('const Button = (props: any)');
    expect(updatedCode).toContain("import { Button, GlassCard } from '../design-system'");
    expect(updatedCode).toContain('<Button>Export</Button>');
  });
});
`;

if (!content.includes('TS2440 import collision')) {
  content = content.replace(/\}\);\s*$/, test8);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✓ Added test 8 to error-root-cause-healing.test.ts');
} else {
  console.log('Test 8 already present');
}
