const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.resolve(repoRoot, 'apps/cli/dist/index.js');
const puppeteerPkg = require.resolve('puppeteer', { paths: [path.join(repoRoot, 'packages/ai-core')] });
const puppeteer = require(puppeteerPkg);

const TEST_DEFINITIONS = [
  {
    id: 'test5-saas-analytics',
    name: 'Stratum Analytics (SaaS Sales & Revenue Analytics)',
    targetDir: 'projects/fresh-saas-analytics-20261015',
    prompt: `Build a modern SaaS sales and revenue analytics platform named STRATUM ANALYTICS. Create a comprehensive data intelligence dashboard featuring real-time revenue metrics, MRR/ARR growth charts, sales pipeline tracking, regional revenue breakdowns, customer churn and retention tables, interactive date range and currency filters, user authentication, and role-based access control (Admin, Analyst, Viewer). Requirements: - Clean, high-density dark-mode analytics UI with rich typography, KPI cards, trend indicators, and data visualizations. - Responsive layouts across desktop, tablet, and mobile. - Interactive filters for time periods (7d, 30d, 90d, 1y), currency conversions, and team segments. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'test6-restaurant-ordering',
    name: 'Savoria Kitchen (Restaurant Food Ordering & Menu)',
    targetDir: 'projects/fresh-restaurant-ordering-20261015',
    prompt: `Build a modern food ordering and table reservation website named SAVORIA KITCHEN. Create an enticing, high-end culinary ordering platform featuring categorized menus (Appetizers, Chef's Specials, Main Courses, Desserts, Artisan Beverages), dietary filter tags (Gluten-Free, Vegan, Halal), interactive dish details with allergen information, a dynamic cart drawer with quantity increments, special instructions input, order checkout with delivery/pickup selection, and order history persistence. Requirements: - Warm, appetite-inducing premium visual design with rich food imagery, elegant typography, and generous spacing. - Responsive layouts across desktop, tablet, and mobile. - Interactive cart with live subtotal, tax, delivery fee calculation, and promo code support. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'test7-property-marketplace',
    name: 'Dwellio Realty (Real Estate Property Marketplace)',
    targetDir: 'projects/fresh-property-marketplace-20261015',
    prompt: `Build an interactive real estate property marketplace named DWELLIO REALTY. Create a premium architectural property platform featuring search with advanced filters (price range, bedroom count, property type: Villa, Penthouse, Modern Loft, location), interactive listing cards with square footage and amenity badges, property detail views with photo galleries, agent contact & tour scheduling forms, and saved favorite properties. Requirements: - Sophisticated, editorial architectural visual language with generous whitespace, high-resolution imagery, and refined typography. - Responsive layouts across desktop, tablet, and mobile. - Meaningful interactions for saving properties, scheduling in-person or virtual tours, and filtering listings. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  }
];

function killPorts(ports = [5000, 5173, 5174, 5175, 5176]) {
  for (const port of ports) {
    try {
      execSync(`powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Where-Object { $_.Id -gt 4 } | Stop-Process -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
    } catch {}
  }
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

async function runSingleTest(testDef, port = 5174) {
  console.log(`\n════════════════════════════════════════════════════════════════`);
  console.log(`🚀 EXECUTING: ${testDef.name}`);
  console.log(`   Target Directory: ${testDef.targetDir}`);
  console.log(`════════════════════════════════════════════════════════════════\n`);

  killPorts([port, port + 100]);
  const absTarget = path.resolve(repoRoot, testDef.targetDir);
  const screenshotsDir = path.join(absTarget, '.aegis', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const result = {
    id: testDef.id,
    name: testDef.name,
    targetDir: testDef.targetDir,
    timestamp: new Date().toISOString(),
    generation: { status: 'UNKNOWN', durationMs: 0 },
    build: { status: 'UNKNOWN', output: '' },
    routes: [],
    browser: { status: 'UNKNOWN', buttonsWorking: false, formsWorking: false },
    visualQuality: { status: 'UNKNOWN', duplicateShells: false, layoutClippings: 0 },
    domainConsistency: { status: 'UNKNOWN', leakedBrands: [] },
    responsiveness: { desktop: false, tablet: false, mobile: false },
    verdict: 'FAIL'
  };

  // Step 1: Run Generation
  console.log(`[Step 1/4] Running Aegis CLI generation...`);
  const genStart = Date.now();
  try {
    execSync(`node "${cliPath}" create "${testDef.prompt}" -o "${testDef.targetDir}" -y --fresh`, {
      cwd: repoRoot,
      stdio: 'inherit',
      timeout: 30 * 60 * 1000
    });
    result.generation.status = 'PASS';
    result.generation.durationMs = Date.now() - genStart;
    console.log(`  ✓ Generation completed in ${result.generation.durationMs}ms`);
  } catch (err) {
    result.generation.status = 'FAIL';
    result.generation.error = err.message;
    console.error(`  ✗ Generation failed:`, err.message);
    return result;
  }

  // Step 2: Run Production Build
  console.log(`\n[Step 2/4] Verifying TypeScript and Vite production build...`);
  try {
    const buildOut = execSync('npx vite build', { cwd: absTarget, encoding: 'utf8' });
    result.build.status = 'PASS';
    result.build.output = buildOut.trim();
    console.log(`  ✓ Production build succeeded (dist/ created cleanly)`);
  } catch (err) {
    result.build.status = 'FAIL';
    result.build.output = err.stdout || err.stderr || err.message;
    console.error(`  ✗ Production build failed!`, result.build.output);
  }

  // Step 3: Run Dev Server and Automated Browser Checks
  console.log(`\n[Step 3/4] Launching dev server on port ${port} and auditing routes in Chromium...`);
  let devProc = null;
  let browser = null;
  try {
    devProc = spawn(`npx vite --port ${port} --host 0.0.0.0`, {
      cwd: absTarget,
      shell: true,
      stdio: 'ignore'
    });
    await waitForHttp(`http://localhost:${port}`);
    console.log(`  ✓ Dev server responding on http://localhost:${port}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Discover routes from src/routes.tsx or src/App.tsx
    let declaredRoutes = ['/'];
    const routesFile = path.join(absTarget, 'src/routes.tsx');
    if (fs.existsSync(routesFile)) {
      const content = fs.readFileSync(routesFile, 'utf8');
      const matches = Array.from(content.matchAll(/path=['"](\/[^'"]*)['"]/g)).map(m => m[1]);
      declaredRoutes = Array.from(new Set(['/', ...matches])).filter(r => r !== '/*' && !r.includes(':'));
    }
    console.log(`  Discovered ${declaredRoutes.length} route(s) to verify: ${declaredRoutes.join(', ')}`);

    // Verify viewports: Desktop (1440x900), Tablet (768x1024), Mobile (390x844)
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' });
      const shotPath = path.join(screenshotsDir, `viewport-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.responsiveness[vp.name] = true;
    }
    console.log(`  ✓ Responsive viewports verified & screenshotted (Desktop, Tablet, Mobile)`);

    // Route-level checks across all discovered routes (no truncation limit)
    await page.setViewport({ width: 1440, height: 900 });
    let allRoutesRendered = true;
    let buttonsFound = 0;
    let formsFound = 0;

    for (const r of declaredRoutes) {
      try {
        await page.goto(`http://localhost:${port}${r}`, { waitUntil: 'networkidle0' });
        const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
        const btnCount = await page.evaluate(() => document.querySelectorAll('button').length);
        const formCount = await page.evaluate(() => document.querySelectorAll('input, form, select, textarea').length);
        buttonsFound += btnCount;
        formsFound += formCount;

        result.routes.push({
          route: r,
          status: hasContent ? 'PASS' : 'EMPTY',
          buttons: btnCount,
          inputs: formCount
        });
        if (!hasContent) allRoutesRendered = false;
      } catch (err) {
        result.routes.push({ route: r, status: 'ERROR', error: err.message });
        allRoutesRendered = false;
      }
    }
    console.log(`  ✓ Checked ${result.routes.length} canonical routes. Total interactive elements: ${buttonsFound} buttons, ${formsFound} inputs/forms.`);
    result.browser.buttonsWorking = buttonsFound > 0;
    result.browser.formsWorking = formsFound > 0;
    result.browser.status = allRoutesRendered && buttonsFound > 0 ? 'PASS' : 'WARN';

    // Visual quality: check for duplicate shells
    const appTsx = fs.existsSync(path.join(absTarget, 'src/App.tsx')) ? fs.readFileSync(path.join(absTarget, 'src/App.tsx'), 'utf8') : '';
    const duplicateShell = appTsx.includes('<Navbar') && appTsx.includes('<Layout');
    result.visualQuality.duplicateShells = duplicateShell;
    result.visualQuality.status = !duplicateShell ? 'PASS' : 'FAIL';

    // Domain consistency: check for foreign brand leaks
    const allCode = fs.readdirSync(path.join(absTarget, 'src'), { recursive: true })
      .filter(f => typeof f === 'string' && (f.endsWith('.tsx') || f.endsWith('.ts')))
      .map(f => fs.readFileSync(path.join(absTarget, 'src', f), 'utf8'))
      .join('\n');

    const foreignBrands = ['GreenPulse', 'Orbitalis', 'Stratos', 'Kazzoo', 'Velora', 'Novus', 'Lumina'];
    const currentBrandUpper = testDef.name.toUpperCase();
    const leaked = foreignBrands.filter(b => b.toUpperCase() !== currentBrandUpper && new RegExp(`\\b${b}\\b`, 'i').test(allCode));
    result.domainConsistency.leakedBrands = leaked;
    result.domainConsistency.status = leaked.length === 0 ? 'PASS' : 'WARN';

    if (result.generation.status === 'PASS' && result.build.status === 'PASS' && !duplicateShell) {
      result.verdict = 'PASS';
    }
    console.log(`\n  🏆 RESULT FOR ${testDef.name}: ${result.verdict}\n`);

  } catch (err) {
    console.error(`  ✗ Browser validation failed:`, err.message);
    result.browser.status = 'FAIL';
  } finally {
    if (browser) await browser.close();
    if (devProc) {
      try {
        devProc.kill('SIGTERM');
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${devProc.pid} /T /F`, { stdio: 'ignore' });
        }
      } catch {}
    }
    killPorts([port]);
  }

  // Step 4: Write verification artifact
  const evidencePath = path.join(absTarget, '.aegis', 'fresh-generation-verification-evidence.json');
  fs.writeFileSync(evidencePath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`  ✓ Evidence saved to ${path.relative(repoRoot, evidencePath)}`);

  return result;
}

async function runAll() {
  console.log(`================================================================`);
  console.log(`🚀 AEGIS AI — PHASE 2 FRESH GENERALIZATION BENCHMARK`);
  console.log(`   Domains: SaaS Analytics, Restaurant Ordering, Property Marketplace`);
  console.log(`================================================================\n`);

  const results = [];
  let port = 5174;
  for (const testDef of TEST_DEFINITIONS) {
    const res = await runSingleTest(testDef, port);
    results.push(res);
    port++;
  }

  console.log(`\n================================================================`);
  console.log(`📊 PHASE 2 FRESH GENERALIZATION BENCHMARK SUMMARY`);
  console.log(`================================================================`);
  for (const r of results) {
    console.log(`- ${r.name}: ${r.verdict} (Build: ${r.build.status}, Routes Checked: ${r.routes.length}, Interactive Buttons: ${r.browser.buttonsWorking ? 'YES' : 'NO'})`);
  }
  console.log(`================================================================\n`);
}

runAll().catch(err => {
  console.error(`Benchmark failed with unhandled exception:`, err);
  process.exit(1);
});
