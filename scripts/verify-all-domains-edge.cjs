const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_ARTIFACT_DIR = 'C:\\Users\\vishn\\.gemini\\antigravity-ide\\brain\\c314194d-355d-44dc-a2ea-ca54806e9f09\\screenshots';

const FESTIVAL_DIR = path.join(BASE_ARTIFACT_DIR, 'festival');
const FURNITURE_DIR = path.join(BASE_ARTIFACT_DIR, 'furniture');

if (!fs.existsSync(FESTIVAL_DIR)) fs.mkdirSync(FESTIVAL_DIR, { recursive: true });
if (!fs.existsSync(FURNITURE_DIR)) fs.mkdirSync(FURNITURE_DIR, { recursive: true });

const testSuites = [
  {
    domain: 'Independent Festival',
    port: 4174,
    outDir: FESTIVAL_DIR,
    routes: [
      { path: '/', name: '01_festival_lineup_desktop', width: 1440, height: 900, label: 'Artist Lineup & Audio' },
      { path: '/navigate-interactive-festival-map', name: '02_festival_map_desktop', width: 1440, height: 900, label: 'Interactive Festival Map' },
      { path: '/multi-stage-schedule', name: '03_festival_stages_desktop', width: 1440, height: 900, label: 'Multi-Stage Schedule' },
      { path: '/complete-vip-ticket-checkout', name: '04_festival_tickets_desktop', width: 1440, height: 900, label: 'VIP Ticket Checkout' },
      { path: '/', name: '01_festival_lineup_mobile', width: 390, height: 844, label: 'Lineup (Mobile)' }
    ]
  },
  {
    domain: 'Luxury Furniture (Atelier Oakhaven)',
    port: 4175,
    outDir: FURNITURE_DIR,
    routes: [
      { path: '/', name: '01_timber_turntable_desktop', width: 1440, height: 900, label: '3D Timber Turntable' },
      { path: '/joinery-chronicle', name: '02_joinery_chronicle_desktop', width: 1440, height: 900, label: 'Mortise & Tenon Joinery Chronicle' },
      { path: '/ergonomics-workbench', name: '03_ergonomics_workbench_desktop', width: 1440, height: 900, label: 'Artisan Ergonomics Workbench' },
      { path: '/timber-provenance', name: '04_timber_provenance_desktop', width: 1440, height: 900, label: 'Timber Harvest Provenance Map' },
      { path: '/', name: '01_timber_turntable_mobile', width: 390, height: 844, label: 'Turntable (Mobile)' }
    ]
  }
];

const allResults = {};

for (const suite of testSuites) {
  console.log(`\n======================================================`);
  console.log(`Starting suite: ${suite.domain} on port ${suite.port}`);
  console.log(`======================================================`);
  allResults[suite.domain] = [];

  for (const target of suite.routes) {
    const url = `http://localhost:${suite.port}${target.path}`;
    const screenshotFile = path.join(suite.outDir, `${target.name}.png`);
    console.log(`\nCapturing: [${suite.domain}] ${target.label} (${target.width}x${target.height})`);

    try {
      execFileSync(EDGE_PATH, [
        '--headless=new',
        '--hide-scrollbars',
        `--window-size=${target.width},${target.height}`,
        `--screenshot=${screenshotFile}`,
        url
      ], { stdio: 'pipe' });

      const exists = fs.existsSync(screenshotFile);
      const size = exists ? fs.statSync(screenshotFile).size : 0;
      console.log(`Screenshot saved: ${exists ? 'YES' : 'NO'} (${size} bytes)`);

      let dom = '';
      try {
        dom = execFileSync(EDGE_PATH, [
          '--headless=new',
          '--dump-dom',
          url
        ], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      } catch (domErr) {
        dom = domErr.stdout || '';
      }

      const hasSafeFallback = dom.includes('SafeFallback') || dom.includes('Loading module interface');
      const hasPlaceholder = dom.toLowerCase().includes('lorem ipsum');
      const hasCanvas = dom.includes('<canvas');
      const domLength = dom.length;

      allResults[suite.domain].push({
        target: target.name,
        label: target.label,
        path: target.path,
        viewport: `${target.width}x${target.height}`,
        screenshotFile,
        screenshotSize: size,
        domLength,
        hasSafeFallback,
        hasPlaceholder,
        hasCanvas
      });
      console.log(`DOM length: ${domLength} chars | SafeFallback: ${hasSafeFallback} | Canvas: ${hasCanvas}`);
    } catch (err) {
      console.error(`Error capturing ${target.label}:`, err.message);
      allResults[suite.domain].push({
        target: target.name,
        label: target.label,
        path: target.path,
        error: err.message
      });
    }
  }
}

fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'three_domains_summary.json'), JSON.stringify(allResults, null, 2));
console.log('\nAll suites captured successfully!');
