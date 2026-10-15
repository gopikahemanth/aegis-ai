const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const repoRoot = path.resolve(__dirname, '..');
const puppeteerPkg = require.resolve('puppeteer', { paths: [path.join(repoRoot, 'packages/ai-core')] });
const puppeteer = require(puppeteerPkg);

// Import DoD evaluator
const { DefinitionOfDone } = require(path.join(repoRoot, 'packages/ai-core/dist/validation/definition-of-done.js'));
const dod = new DefinitionOfDone();

const PROJECTS = [
  {
    id: 'test5-saas-analytics',
    name: 'Stratum Analytics',
    domain: 'SaaS Sales & Revenue Analytics Platform',
    targetDir: 'projects/fresh-saas-analytics-20261015',
    port: 5174,
    inferredFeatures: [
      'Authentication & Role-Based Access Control (RBAC)',
      'Real-time Revenue & MRR/ARR Growth Analytics',
      'Interactive Sales Pipeline & Velocity Tracking',
      'Customer Cohort Retention & Churn Matrix'
    ]
  },
  {
    id: 'test6-restaurant-ordering',
    name: 'Savoria Kitchen',
    domain: 'Restaurant Food Ordering & Menu Platform',
    targetDir: 'projects/fresh-restaurant-ordering-20261015',
    port: 5175,
    inferredFeatures: [
      'Categorized Menu & Dietary Filters',
      'Interactive Dish Details & Allergen Modal',
      'Dynamic Cart Drawer',
      'Table Reservation System'
    ]
  },
  {
    id: 'test7-property-marketplace',
    name: 'Dwellio Realty',
    domain: 'Real Estate Property Marketplace',
    targetDir: 'projects/fresh-property-marketplace-20261015',
    port: 5176,
    inferredFeatures: [
      'Advanced Property Search and Filtering',
      'Interactive Listing Grid and Cards',
      'Immersive Property Detail View',
      'Tour Scheduling and Agent Contact'
    ]
  }
];

function killPort(port) {
  try {
    execSync(`powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Where-Object { $_.Id -gt 4 } | Stop-Process -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
  } catch {}
}

function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve(true);
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
      else setTimeout(check, 600);
    };
    check();
  });
}

async function auditProject(proj, browser) {
  console.log(`\n════════════════════════════════════════════════════════════════`);
  console.log(`🚀 AUDITING: ${proj.name} (${proj.domain})`);
  console.log(`   Directory: ${proj.targetDir} | Port: ${proj.port}`);
  console.log(`════════════════════════════════════════════════════════════════`);

  killPort(proj.port);
  const absTarget = path.resolve(repoRoot, proj.targetDir);
  const screenshotsDir = path.join(absTarget, '.aegis', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const auditReport = {
    id: proj.id,
    name: proj.name,
    domain: proj.domain,
    targetDir: proj.targetDir,
    timestamp: new Date().toISOString(),
    build: { status: 'UNKNOWN', durationMs: 0 },
    routes: [],
    interactiveElements: { buttons: 0, inputs: 0, forms: 0, selects: 0 },
    viewports: { desktop: false, tablet: false, mobile: false },
    visualQuality: { duplicateShells: false, layoutClippings: 0 },
    domainConsistency: { status: 'PASS', leakedBrands: [] },
    dodScore: 0,
    dodPassed: false,
    dodSummary: '',
    dodCriteria: { total: 0, passed: 0, failed: 0, warnings: 0, blockers: 0 }
  };

  // 1. Production Build Test
  console.log(`[Step 1/4] Verifying production build (npx vite build)...`);
  const buildStart = Date.now();
  try {
    execSync('npx vite build', { cwd: absTarget, stdio: 'pipe' });
    auditReport.build.status = 'PASS';
    auditReport.build.durationMs = Date.now() - buildStart;
    console.log(`  ✓ Production build succeeded in ${auditReport.build.durationMs}ms`);
  } catch (err) {
    auditReport.build.status = 'FAIL';
    auditReport.build.error = err.message;
    console.error(`  ✗ Production build failed!`, err.message);
  }

  // 2. Dev Server and Chromium Route Audit
  console.log(`[Step 2/4] Spawning Vite dev server on port ${proj.port}...`);
  let devProc = null;
  try {
    devProc = spawn(`npx vite --port ${proj.port} --host 127.0.0.1`, {
      cwd: absTarget,
      shell: true,
      stdio: 'ignore'
    });
    await waitForHttp(`http://localhost:${proj.port}`);
    console.log(`  ✓ Dev server live on http://localhost:${proj.port}`);

    const page = await browser.newPage();

    // Responsive Viewports
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${proj.port}/`, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: path.join(screenshotsDir, `viewport-${vp.name}.png`), fullPage: true });
      auditReport.viewports[vp.name] = true;
    }
    console.log(`  ✓ Multi-viewport screenshots captured (desktop, tablet, mobile)`);

    // Discover routes from src/routes.tsx
    let declaredRoutes = ['/'];
    const routesFile = path.join(absTarget, 'src/routes.tsx');
    if (fs.existsSync(routesFile)) {
      const content = fs.readFileSync(routesFile, 'utf8');
      const matches = Array.from(content.matchAll(/path=['"](\/[^'"]*)['"]/g)).map(m => m[1]);
      declaredRoutes = Array.from(new Set(['/', ...matches])).filter(r => r !== '/*' && !r.includes(':'));
    }
    console.log(`  Discovered ${declaredRoutes.length} route(s): ${declaredRoutes.join(', ')}`);

    await page.setViewport({ width: 1440, height: 900 });

    for (const r of declaredRoutes) {
      try {
        await page.goto(`http://localhost:${proj.port}${r}`, { waitUntil: 'networkidle0' });
        const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
        const titleText = await page.evaluate(() => document.title || document.querySelector('h1, h2')?.innerText || '');
        const btnCount = await page.evaluate(() => document.querySelectorAll('button').length);
        const inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
        const selectCount = await page.evaluate(() => document.querySelectorAll('select').length);
        const formCount = await page.evaluate(() => document.querySelectorAll('form').length);

        auditReport.interactiveElements.buttons += btnCount;
        auditReport.interactiveElements.inputs += inputCount;
        auditReport.interactiveElements.forms += formCount;
        auditReport.interactiveElements.selects += selectCount;

        // Take route screenshot
        const cleanSlug = r === '/' ? 'root' : r.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        await page.screenshot({ path: path.join(screenshotsDir, `route-${cleanSlug}.png`), fullPage: false });

        auditReport.routes.push({
          route: r,
          status: hasContent ? 'RENDERED' : 'EMPTY',
          buttons: btnCount,
          inputs: inputCount,
          selects: selectCount,
          title: titleText.slice(0, 40)
        });
        console.log(`    Route "${r}": ${hasContent ? '✓ PASS' : '✗ EMPTY'} (${btnCount} buttons, ${inputCount} inputs)`);
      } catch (err) {
        auditReport.routes.push({ route: r, status: 'ERROR', error: err.message });
        console.log(`    Route "${r}": ✗ ERROR (${err.message})`);
      }
    }

    // Check duplicate shells
    const appTsx = fs.existsSync(path.join(absTarget, 'src/App.tsx')) ? fs.readFileSync(path.join(absTarget, 'src/App.tsx'), 'utf8') : '';
    const hasDupShell = appTsx.includes('<Navbar') && appTsx.includes('<Layout');
    auditReport.visualQuality.duplicateShells = hasDupShell;

    // Check foreign brand leaks
    const allSrc = fs.readdirSync(path.join(absTarget, 'src'), { recursive: true })
      .filter(f => typeof f === 'string' && (f.endsWith('.tsx') || f.endsWith('.ts')))
      .map(f => fs.readFileSync(path.join(absTarget, 'src', f), 'utf8'))
      .join('\n');
    const brands = ['GreenPulse', 'Orbitalis', 'Stratos', 'Kazzoo', 'Velora', 'Novus', 'Lumina'];
    const currentBrandUpper = proj.name.toUpperCase();
    const leaked = brands.filter(b => b.toUpperCase() !== currentBrandUpper && new RegExp(`\\b${b}\\b`, 'i').test(allSrc));
    auditReport.domainConsistency.leakedBrands = leaked;
    auditReport.domainConsistency.status = leaked.length === 0 ? 'PASS' : 'WARN';

    await page.close();
  } catch (err) {
    console.error(`  ✗ Dev server or Chromium audit failed:`, err.message);
  } finally {
    if (devProc) {
      try {
        devProc.kill('SIGTERM');
        if (process.platform === 'win32') execSync(`taskkill /pid ${devProc.pid} /T /F`, { stdio: 'ignore' });
      } catch {}
    }
    killPort(proj.port);
  }

  // 3. Definition of Done Assessment
  console.log(`[Step 3/4] Running production Definition of Done evaluation...`);
  try {
    const dodResult = dod.validate(absTarget, proj.inferredFeatures, true);
    auditReport.dodScore = dodResult.score;
    auditReport.dodPassed = dodResult.passed;
    auditReport.dodSummary = dodResult.summary;
    auditReport.dodCriteria = {
      total: dodResult.criteria.length,
      passed: dodResult.criteria.filter(c => c.passed).length,
      failed: dodResult.criteria.filter(c => !c.passed).length,
      blockers: dodResult.blockers.length,
      warnings: dodResult.warnings.length
    };
    console.log(`  ✓ DoD Evaluation: ${dodResult.score}/100 (${dodResult.passed ? 'CERTIFIED' : 'FAILED'})`);
    console.log(`    Criteria Passed: ${auditReport.dodCriteria.passed}/${auditReport.dodCriteria.total} | Blockers: ${auditReport.dodCriteria.blockers} | Warnings: ${auditReport.dodCriteria.warnings}`);
  } catch (err) {
    console.error(`  ✗ DoD Evaluation error:`, err.message);
  }

  // 4. Save Evidence
  const evidenceFile = path.join(absTarget, '.aegis', 'fresh-generation-verification-evidence.json');
  fs.writeFileSync(evidenceFile, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`[Step 4/4] Evidence artifact saved to ${path.relative(repoRoot, evidenceFile)}`);

  return auditReport;
}

async function runFullAudit() {
  console.log(`================================================================`);
  console.log(`🚀 AEGIS AI — PHASE 2 FRESH GENERALIZATION AUDIT`);
  console.log(`   Auditing 3 Brand New Project Generations`);
  console.log(`================================================================`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  try {
    for (const proj of PROJECTS) {
      const report = await auditProject(proj, browser);
      results.push(report);
    }
  } finally {
    await browser.close();
  }

  // Output Consolidated Results Table
  console.log(`\n================================================================`);
  console.log(`📊 PHASE 2 CONSOLIDATED BENCHMARK RESULTS`);
  console.log(`================================================================`);
  console.log(`| Project | Domain | Build | Routes Rendered | Buttons | Inputs | DoD Score | Blockers | Warnings | Status |`);
  console.log(`|---------|--------|-------|-----------------|---------|--------|-----------|----------|----------|--------|`);
  for (const r of results) {
    const renderedCount = r.routes.filter(rt => rt.status === 'RENDERED').length;
    console.log(`| ${r.name} | ${r.domain} | ${r.build.status} | ${renderedCount}/${r.routes.length} | ${r.interactiveElements.buttons} | ${r.interactiveElements.inputs} | ${r.dodScore}/100 | ${r.dodCriteria.blockers} | ${r.dodCriteria.warnings} | ${r.dodPassed ? 'PASS' : 'FAIL'} |`);
  }
  console.log(`================================================================\n`);

  const auditJsonPath = path.join(repoRoot, 'scripts', 'fresh_generalization_audit_results.json');
  fs.writeFileSync(auditJsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`✓ Full results written to scripts/fresh_generalization_audit_results.json`);
}

runFullAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
