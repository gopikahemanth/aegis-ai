const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const puppeteerPkg = require.resolve('puppeteer', { paths: [path.join(__dirname, '../packages/ai-core')] });
const puppeteer = require(puppeteerPkg);

const projectDir = path.resolve(__dirname, '../projects/aegis-verification-run-20261014-190226');
const screenshotsDir = path.join(projectDir, '.aegis', 'screenshots', 'suite1');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(check, 600);
      }
    };
    check();
  });
}

function queryPostgres(sql) {
  const psqlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
  const env = { ...process.env, PGPASSWORD: 'postgres' };
  const { execFileSync } = require('child_process');
  const tmpFile = path.join(__dirname, '../.tmp_query.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const output = execFileSync(psqlPath, [
      '-U', 'postgres',
      '-h', 'localhost',
      '-p', '5432',
      '-d', 'greenpulse_app',
      '-t',
      '-A',
      '-F', ',',
      '-f', tmpFile
    ], { env, encoding: 'utf8' }).trim();
    return output;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

async function run() {
  console.log('================================================================');
  console.log('AEGIS AI — Full Browser-to-PostgreSQL Persistence Loop Proof');
  console.log('Target: Browser form -> HTTP POST -> Prisma -> PostgreSQL -> HTTP GET -> Browser reload');
  console.log('================================================================\n');

  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    // 1. Start backend server
    console.log('[1/7] Launching backend server on port 5000...');
    backendProc = spawn('npx tsx server/index.ts', {
      cwd: projectDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    backendProc.stdout.on('data', d => console.log('  [Backend stdout]:', d.toString().trim()));
    backendProc.stderr.on('data', d => console.log('  [Backend stderr]:', d.toString().trim()));

    // 2. Start frontend dev server
    console.log('[2/7] Launching Vite frontend on port 5173...');
    frontendProc = spawn('npx vite --port 5173 --host 0.0.0.0', {
      cwd: projectDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    console.log('[3/7] Waiting for servers to be ready...');
    await waitForHttp('http://localhost:5000/api/assets');
    console.log('  ✓ Backend ready at http://localhost:5000/api/assets');
    await waitForHttp('http://localhost:5173/assets');
    console.log('  ✓ Frontend ready at http://localhost:5173/assets\n');

    // Generate unique record identifier
    const uniqueId = `SOLARIS-CERT-${Date.now()}`;
    const testCapacity = 245.8;
    const testOutput = 215.2;
    const testLocation = 'Mojave High Desert Sector 9';
    console.log(`[4/7] Generated Unique Target Record: "${uniqueId}"`);

    // 3. Browser form automation via Puppeteer
    console.log('[5/7] Executing Browser form interaction via Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://localhost:5173/assets', { waitUntil: 'networkidle0' });
    console.log('  ✓ Navigated to http://localhost:5173/assets');

    // Find "Add Asset" button directly
    const buttons = await page.$$('button');
    let addAssetButton = null;
    for (const b of buttons) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Add Asset')) {
        addAssetButton = b;
        break;
      }
    }
    if (!addAssetButton) throw new Error('Could not find Add Asset button');

    await addAssetButton.click();
    console.log('  ✓ Clicked "Add Asset" modal trigger');

    // Wait for form
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill form fields
    const inputs = await page.$$('input');
    // inputs: name, capacity, currentOutput, location
    await inputs[0].type(uniqueId);
    await inputs[1].type(testCapacity.toString());
    await inputs[2].type(testOutput.toString());
    await inputs[3].type(testLocation);
    console.log(`  ✓ Filled form inputs with unique ID: ${uniqueId}`);

    // Submit form
    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error('Could not find submit button');
    
    // Intercept or listen for the HTTP POST request
    const postPromise = page.waitForResponse(
      res => res.url().includes('/api/assets') && res.request().method() === 'POST' && res.status() === 201,
      { timeout: 10000 }
    );

    await submitBtn.click();
    console.log('  ✓ Submitted form (Triggered HTTP POST /api/assets)');

    const postResponse = await postPromise;
    const postResponseBody = await postResponse.json();
    console.log(`  ✓ HTTP POST completed: status 201, returned ID ${postResponseBody.id}`);

    // 4. DIRECT POSTGRESQL VERIFICATION
    console.log('\n[6/7] Verifying direct PostgreSQL table row...');
    const pgQuery = `SELECT id, name, "capacityMw", "currentOutputMw", location, "createdAt" FROM "Asset" WHERE name = '${uniqueId}';`;
    const pgResult = queryPostgres(pgQuery);
    console.log(`  ✓ PostgreSQL Raw Output: "${pgResult}"`);
    if (!pgResult || !pgResult.includes(uniqueId)) {
      throw new Error(`CRITICAL: PostgreSQL did not contain the record "${uniqueId}"!`);
    }
    const [pgId, pgName, pgCap, pgOut, pgLoc, pgCreated] = pgResult.split(',');
    console.log('  🎉 PROVEN IN POSTGRESQL:', {
      postgresId: pgId,
      name: pgName,
      capacityMw: pgCap,
      outputMw: pgOut,
      location: pgLoc,
      createdAt: pgCreated
    });

    // 5. INDEPENDENT HTTP GET VERIFICATION
    console.log('\n[7/7] Independent HTTP GET & Browser Reload Verification...');
    const getRes = await fetch('http://localhost:5000/api/assets');
    const getAssets = await getRes.json();
    const foundInGet = getAssets.find(a => a.name === uniqueId);
    if (!foundInGet) {
      throw new Error(`CRITICAL: HTTP GET /api/assets did not return "${uniqueId}"!`);
    }
    console.log(`  ✓ Independent HTTP GET returned record: ID=${foundInGet.id}, Name=${foundInGet.name}`);

    // 6. BROWSER RELOAD VERIFICATION
    console.log('  Reloading browser to prove full DOM re-hydration from database...');
    await page.reload({ waitUntil: 'networkidle0' });

    // Assert uniqueId is in the DOM
    await page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      { timeout: 10000 },
      uniqueId
    );
    console.log(`  ✓ Live DOM contains unique asset record "${uniqueId}"!`);

    // Capture screenshot proof
    const screenshotPath = path.join(screenshotsDir, 'browser-postgres-persistence-proof.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 Saved browser proof screenshot: ${screenshotPath}`);

    // Write full structured evidence
    const evidence = {
      timestamp: new Date().toISOString(),
      testSuite: 'Suite 1 — Full Persistence Loop Certification',
      database: 'PostgreSQL 18.4 (localhost:5432/greenpulse_app)',
      recordIdentifier: uniqueId,
      chain: {
        step1_browserForm: {
          status: 'PASS',
          action: 'Puppeteer filled and submitted "Register New Asset" form',
          formData: {
            name: uniqueId,
            capacityMw: testCapacity,
            currentOutputMw: testOutput,
            location: testLocation
          }
        },
        step2_httpPost: {
          status: 'PASS',
          endpoint: 'POST /api/assets',
          httpStatus: postResponse.status(),
          responsePayload: postResponseBody
        },
        step3_prismaWrite: {
          status: 'PASS',
          orm: 'Prisma Client v6.19.3',
          table: 'Asset'
        },
        step4_postgresRow: {
          status: 'PASS',
          databaseEngine: 'PostgreSQL 18.4 (x86_64-windows)',
          directPsqlQuery: pgQuery,
          persistedRow: {
            id: pgId,
            name: pgName,
            capacityMw: parseFloat(pgCap),
            currentOutputMw: parseFloat(pgOut),
            location: pgLoc,
            createdAt: pgCreated
          }
        },
        step5_httpGet: {
          status: 'PASS',
          endpoint: 'GET /api/assets',
          returnedRecord: foundInGet
        },
        step6_browserReload: {
          status: 'PASS',
          reloadedUrl: 'http://localhost:5173/assets',
          domVerification: `Document body contains "${uniqueId}"`,
          screenshot: screenshotPath
        }
      },
      finalVerdict: 'FULL_PERSISTENCE_LOOP_CERTIFIED'
    };

    const evidenceFile = path.join(projectDir, '.aegis', 'full-persistence-loop-evidence.json');
    fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2), 'utf8');
    console.log(`\n✅ Full persistence evidence recorded to: ${evidenceFile}`);
    console.log('\n================================================================');
    console.log('RESULT: 100% UNCONDITIONAL PASS FOR FULL PERSISTENCE LOOP');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Persistence Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (backendProc) {
      try { process.kill(backendProc.pid); } catch {}
    }
    if (frontendProc) {
      try { process.kill(frontendProc.pid); } catch {}
    }
    // Clean up any remaining node processes on port 5000 / 5173
    try {
      execSync('powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore' });
      execSync('powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore' });
    } catch {}
  }
}

run();
