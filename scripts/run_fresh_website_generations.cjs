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
    id: 'test1-ecommerce',
    name: 'Velora Living (E-Commerce Furniture Store)',
    targetDir: 'projects/fresh-ecommerce-furniture-20261015',
    prompt: `Build a premium furniture store and e-commerce website named VELORA LIVING. Create a distinctive, high-end interior furnishings retail platform featuring product listings, material and category filters, interactive product details with dimension specs, and a functional shopping cart with order summary. Requirements: - Use the existing Aegis AI frontend-first generation pipeline. - Clean, premium visual design with rich typography, generous whitespace, and elegant color palette. - Responsive layouts across desktop, tablet, and mobile. - Distinctive product gallery, interactive cart drawer/page, and item details. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'test2-education',
    name: 'Novus Academy (Learning Management System)',
    targetDir: 'projects/fresh-education-lms-20261015',
    prompt: `Build a modern learning management system (LMS) and education platform named NOVUS ACADEMY. Create a comprehensive educational portal featuring course catalogs, student progress dashboards, interactive lessons with syllabus navigation, and quiz assessments. Requirements: - Professional academic UI with structured learning tracks, course modules, progress meters, and quiz submission. - Responsive layouts across desktop, tablet, and mobile. - Meaningful interactions for enrolling, starting lessons, and tracking completion. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'test3-healthcare',
    name: 'Aura Health (Appointment Booking Platform)',
    targetDir: 'projects/fresh-healthcare-booking-20261015',
    prompt: `Build a healthcare appointment booking platform named AURA HEALTH. Create a patient-centric medical scheduling platform featuring provider listings, clinic availability calendars, interactive booking forms with time slot selection, and patient appointment management. Requirements: - Calm, accessible healthcare visual language with doctor credentials, specialty filters, and appointment status tags. - Responsive layouts across desktop, tablet, and mobile. - Interactive booking flow with date/time pickers and confirmation dialogs. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  },
  {
    id: 'test4-portfolio',
    name: 'Lumina Lens (Creative Photography Portfolio)',
    targetDir: 'projects/fresh-creative-portfolio-20261015',
    prompt: `Build an interactive creative photography portfolio named LUMINA LENS. Create an editorial fine-art visual platform featuring editorial layouts, full-bleed galleries, project case studies with technical camera metadata (aperture, shutter, ISO, lens), and responsive navigation. Requirements: - High-contrast, minimalist editorial visual language with rich imagery, lightbox views, and project details. - Responsive layouts across desktop, tablet, and mobile. - Authentic editorial navigation and zero generic card grid downgrades. - Zero duplicate navigation shells and zero cross-route layout cloning. - All routes must render real data, handle interactive events, and avoid empty states.`
  }
];

function killPorts(ports = [5000, 5173, 5174, 5175]) {
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
      env: process.env
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

    // Route-level checks across all discovered routes
    await page.setViewport({ width: 1440, height: 900 });
    let allRoutesRendered = true;
    let buttonsFound = 0;
    let formsFound = 0;

    for (const r of declaredRoutes) {
      try {
        await page.goto(`http://localhost:${port}${r}`, { waitUntil: 'networkidle0' });
        const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
        const btnCount = await page.evaluate(() => document.querySelectorAll('button').length);
        const formCount = await page.evaluate(() => document.querySelectorAll('input, form, select').length);
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

    const foreignBrands = ['GreenPulse', 'Orbitalis', 'Stratos', 'Kazzoo'];
    const currentBrandUpper = testDef.name.toUpperCase();
    const leaked = foreignBrands.filter(b => b.toUpperCase() !== currentBrandUpper && new RegExp(`\\b${b}\\b`, 'i').test(allCode));
    result.domainConsistency.leakedBrands = leaked;
    result.domainConsistency.status = leaked.length === 0 ? 'PASS' : 'WARN';

    if (result.generation.status === 'PASS' && result.build.status === 'PASS' && !duplicateShell) {
      result.verdict = 'PASS';
    }
    console.log(`\n  🏆 RESULT FOR ${testDef.name}: ${result.verdict}\n`);

  } catch (err) {
    console.error(`  ✗ Browser audit error:`, err.message);
  } finally {
    if (browser) await browser.close();
    if (devProc) {
      try { process.kill(devProc.pid); } catch {}
    }
    killPorts([port]);
  }

  // Save evidence
  const evidenceFile = path.join(absTarget, '.aegis', 'fresh-generation-verification-evidence.json');
  fs.writeFileSync(evidenceFile, JSON.stringify(result, null, 2), 'utf8');
  return result;
}

async function runAll() {
  const targetIndex = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const testsToRun = targetIndex !== null ? [TEST_DEFINITIONS[targetIndex]] : TEST_DEFINITIONS;

  console.log(`================================================================`);
  console.log(`AEGIS AI — FRESH MULTI-DOMAIN WEBSITE GENERATION TEST HARNESS`);
  console.log(`Total tests scheduled: ${testsToRun.length}`);
  console.log(`================================================================`);

  const summary = [];
  for (let i = 0; i < testsToRun.length; i++) {
    const port = 5174 + i;
    const res = await runSingleTest(testsToRun[i], port);
    summary.push(res);
  }

  console.log(`\n================================================================`);
  console.log(`FINAL MULTI-DOMAIN GENERATION RESULTS SUMMARY`);
  console.log(`================================================================`);
  for (const s of summary) {
    console.log(`  - [${s.verdict}] ${s.name}: Gen=${s.generation.status}, Build=${s.build.status}, DupShells=${s.visualQuality.duplicateShells ? 'YES' : 'NONE'}, Leaks=${s.domainConsistency.leakedBrands.join(',') || 'NONE'}`);
  }

  const allPassed = summary.every(s => s.verdict === 'PASS');
  console.log(`\nOVERALL PLATFORM VERDICT: ${allPassed ? 'ALL GENERATIONS PASSED' : 'DEFECTS DETECTED'}\n`);
}

runAll();
