const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const puppeteer = require(path.join(__dirname, '../packages/ai-core/node_modules/puppeteer'));

const projects = [
  {
    name: 'Velora Living',
    domain: 'Furniture E-Commerce',
    dir: 'projects/fresh-ecommerce-furniture-20261015',
    port: 5211,
    domainKeywords: ['Velora', 'Living', 'Furniture', 'Interior', 'Collection', 'Cart', 'Exhibition', 'Design']
  },
  {
    name: 'Novus Academy',
    domain: 'Education LMS',
    dir: 'projects/fresh-education-lms-20261015',
    port: 5212,
    domainKeywords: ['Novus', 'Academy', 'Course', 'Lesson', 'Quiz', 'Student', 'Progress', 'Curriculum']
  },
  {
    name: 'Aura Health',
    domain: 'Healthcare Booking',
    dir: 'projects/fresh-healthcare-booking-20261015',
    port: 5213,
    domainKeywords: ['Aura', 'Health', 'Appointment', 'Clinic', 'Calendar', 'Provider', 'Doctor', 'Care']
  },
  {
    name: 'Lumina Lens',
    domain: 'Creative Portfolio',
    dir: 'projects/fresh-creative-portfolio-20261015',
    port: 5214,
    domainKeywords: ['Lumina', 'Lens', 'Photography', 'Gallery', 'Exif', 'Lightbox', 'Case Study', 'Inquiry']
  }
];

function waitForHttp(url, maxWaitMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    }
    function retry() {
      if (Date.now() - start > maxWaitMs) {
        reject(new Error(`Timeout waiting for HTTP at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    }
    check();
  });
}

async function auditProject(proj, browser) {
  console.log(`\n================================================================`);
  console.log(`AUDITING PROJECT: ${proj.name} (${proj.domain})`);
  console.log(`Path: ${proj.dir}`);

  const absPath = path.resolve(proj.dir);
  if (!fs.existsSync(absPath)) {
    console.error(`Project directory does not exist: ${absPath}`);
    return null;
  }

  // 1. Read Architecture Contract Required Routes
  const repPath = path.join(absPath, '.aegis/execution-report.json');
  let contractRoutes = [];
  if (fs.existsSync(repPath)) {
    const rep = JSON.parse(fs.readFileSync(repPath, 'utf8'));
    contractRoutes = rep.architectureContract?.requiredRoutes || [];
  }

  // 2. Read Declared Routes in routes.tsx
  const routesFile = path.join(absPath, 'src/routes.tsx');
  let declaredRoutes = [];
  if (fs.existsSync(routesFile)) {
    const content = fs.readFileSync(routesFile, 'utf8');
    const regex = /path=['"](\/[^'"]*)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1] !== '/*' && !match[1].includes(':')) {
        declaredRoutes.push(match[1]);
      }
    }
    declaredRoutes = Array.from(new Set(['/', ...declaredRoutes]));
  }

  console.log(`Required Routes (${contractRoutes.length}):`, contractRoutes);
  console.log(`Declared Routes (${declaredRoutes.length}):`, declaredRoutes);

  // 3. Launch Vite dev server
  console.log(`Starting Vite on port ${proj.port}...`);
  const devProc = spawn(`npx vite --port ${proj.port} --host 0.0.0.0`, {
    cwd: absPath,
    shell: true,
    stdio: 'ignore'
  });

  try {
    await waitForHttp(`http://localhost:${proj.port}`);
    console.log(`Dev server ready on http://localhost:${proj.port}`);

    const screenshotsDir = path.join(absPath, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const auditResults = [];

    // Audit every declared route
    for (const r of declaredRoutes) {
      const url = `http://localhost:${proj.port}${r}`;
      const safeName = r === '/' ? 'root' : r.replace(/[^a-zA-Z0-9_-]/g, '_');
      const shotFile = path.join(screenshotsDir, `audit-route-${safeName}.png`);

      let status = 'PASS';
      let title = '';
      let textLen = 0;
      let matchedKeywords = [];
      let buttonsCount = 0;
      let inputsCount = 0;
      let errorMessage = null;

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        textLen = bodyText.length;
        buttonsCount = await page.evaluate(() => document.querySelectorAll('button').length);
        inputsCount = await page.evaluate(() => document.querySelectorAll('input, select, textarea').length);

        // Check domain keywords
        for (const kw of proj.domainKeywords) {
          if (new RegExp(kw, 'i').test(bodyText) || new RegExp(kw, 'i').test(title)) {
            matchedKeywords.push(kw);
          }
        }

        if (textLen < 30) {
          status = 'EMPTY_CONTENT';
        }

        await page.screenshot({ path: shotFile, fullPage: false });
      } catch (err) {
        status = 'ERROR';
        errorMessage = err.message;
      }

      const isRequired = contractRoutes.includes(r);
      auditResults.push({
        route: r,
        isRequired,
        status,
        textLength: textLen,
        buttons: buttonsCount,
        inputs: inputsCount,
        matchedKeywords: matchedKeywords.slice(0, 4),
        screenshot: path.basename(shotFile),
        errorMessage
      });

      console.log(`  Route ${r.padEnd(35)} | Req: ${isRequired ? 'YES' : 'NO '} | Status: ${status.padEnd(10)} | Text: ${String(textLen).padStart(5)} chars | UI: ${buttonsCount} btns, ${inputsCount} inputs | Keywords: [${matchedKeywords.slice(0, 3).join(', ')}]`);
    }

    await page.close();

    // Reconcile counts
    const renderedRoutes = auditResults.filter(a => a.status === 'PASS').map(a => a.route);
    const missingRequiredRoutes = contractRoutes.filter(r => !renderedRoutes.includes(r));
    const optionalOrAliasRoutes = declaredRoutes.filter(r => !contractRoutes.includes(r));

    const summary = {
      project: proj.name,
      domain: proj.domain,
      requiredCount: contractRoutes.length,
      implementedCount: declaredRoutes.length,
      renderedCount: renderedRoutes.length,
      missingRequiredCount: missingRequiredRoutes.length,
      missingRequiredRoutes,
      optionalOrAliasRoutes,
      details: auditResults
    };

    return summary;
  } finally {
    try {
      devProc.kill('SIGTERM');
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${devProc.pid} /T /F`, { stdio: 'ignore' });
      }
    } catch {}
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allSummaries = [];
  try {
    for (const proj of projects) {
      const summary = await auditProject(proj, browser);
      if (summary) allSummaries.push(summary);
    }
  } finally {
    await browser.close();
  }

  // Save audit evidence to file
  const evidenceOut = path.join(__dirname, 'route_reconciliation_audit_report.json');
  fs.writeFileSync(evidenceOut, JSON.stringify(allSummaries, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('ROUTE RECONCILIATION SUMMARY TABLE:');
  console.log('================================================================');
  console.log('Project               | Required | Implemented | Rendered | Missing | Status');
  console.log('----------------------|----------|-------------|----------|---------|-------');
  for (const s of allSummaries) {
    const ok = s.missingRequiredCount === 0;
    console.log(
      `${s.project.padEnd(21)} | ${String(s.requiredCount).padStart(8)} | ${String(s.implementedCount).padStart(11)} | ${String(s.renderedCount).padStart(8)} | ${String(s.missingRequiredCount).padStart(7)} | ${ok ? 'CERTIFIED (100% rendered)' : 'MISSING'}`
    );
  }
  console.log('================================================================\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
