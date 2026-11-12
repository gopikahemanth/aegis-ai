const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/governance/__tests__/pipeline-root-cause-integrity.test.ts');
let content = fs.readFileSync(file, 'utf8');

const target = `    expect(cleanedSiteContent).not.toContain("import siteContent from './site-content'");
  });`;

const replacement = `    expect(cleanedSiteContent).not.toContain("import siteContent from './site-content'");

    // 6. Test TsSymbolRepairEngine on TS2440 (Import conflicts with local declaration)
    const testConflictCaller = join(TEST_DIR, "src", "pages", "ConflictPage.tsx");
    writeFileSync(
      testConflictCaller,
      \`import React from 'react';\\nimport { Button } from '../design-system';\\nconst Button = (props: any) => <button {...props}>{props.children}</button>;\\nexport function ConflictPage() { return <Button>Click</Button>; }\\n\`,
      "utf8"
    );
    const ts2440Stderr = \`src/pages/ConflictPage.tsx(2,10): error TS2440: Import declaration conflicts with local declaration of 'Button'.\`;
    const ts2440Actions = TsSymbolRepairEngine.repair(TEST_DIR, ts2440Stderr);
    expect(ts2440Actions.length).toBeGreaterThan(0);
    const updatedConflictCaller = readFileSync(testConflictCaller, "utf8");
    expect(updatedConflictCaller).not.toContain("const Button = (props: any)");
    expect(updatedConflictCaller).toContain("import { Button } from '../design-system'");
  });`;

if (!content.includes('Test TsSymbolRepairEngine on TS2440')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✓ Added TS2440 test to pipeline-root-cause-integrity.test.ts');
} else {
  console.log('TS2440 test already present');
}
