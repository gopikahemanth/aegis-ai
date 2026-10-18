const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\vishn\\.gemini\\antigravity-ide\\brain\\c314194d-355d-44dc-a2ea-ca54806e9f09\\screenshots\\celestia_nocturne';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const targets = [
  // Celestia Nocturne A (Seed 101 - Asymmetric Editorial)
  {
    name: 'celestia_a_desktop_1440',
    port: 4181,
    path: '/',
    viewport: [1440, 900],
    seed: 101,
    expectedVariant: 'asymmetric_cards'
  },
  {
    name: 'celestia_a_tablet_768',
    port: 4181,
    path: '/',
    viewport: [768, 1024],
    seed: 101
  },
  {
    name: 'celestia_a_mobile_390',
    port: 4181,
    path: '/',
    viewport: [390, 844],
    seed: 101,
    checkMobileOverflow: true
  },
  {
    name: 'celestia_a_journey_1440',
    port: 4181,
    path: '/cosmic-journey',
    viewport: [1440, 900],
    capability: 'SCROLL_STORY'
  },
  {
    name: 'celestia_a_astrometry_1440',
    port: 4181,
    path: '/astrometry-chart',
    viewport: [1440, 900],
    capability: 'SPATIAL_MAP'
  },

  // Celestia Nocturne B (Seed 202 - Dual-Column Spec Workbench)
  {
    name: 'celestia_b_desktop_1440',
    port: 4182,
    path: '/',
    viewport: [1440, 900],
    seed: 202,
    expectedVariant: 'workbench_dual_column'
  },
  {
    name: 'celestia_b_tablet_768',
    port: 4182,
    path: '/',
    viewport: [768, 1024],
    seed: 202
  },
  {
    name: 'celestia_b_mobile_390',
    port: 4182,
    path: '/',
    viewport: [390, 844],
    seed: 202,
    checkMobileOverflow: true
  },
  {
    name: 'celestia_b_journey_1440',
    port: 4182,
    path: '/cosmic-journey',
    viewport: [1440, 900],
    capability: 'SCROLL_STORY'
  },
  {
    name: 'celestia_b_astrometry_1440',
    port: 4182,
    path: '/astrometry-chart',
    viewport: [1440, 900],
    capability: 'SPATIAL_MAP'
  }
];

console.log('Starting Edge Browser Verification for Celestia Nocturne (A vs B)...');
const results = [];

for (const t of targets) {
  const url = `http://localhost:${t.port}${t.path}`;
  const [w, h] = t.viewport;
  const pngPath = path.join(ARTIFACT_DIR, `${t.name}.png`);

  console.log(`\nCapturing: [${t.name}] ${url} @ ${w}x${h}`);

  try {
    execFileSync(EDGE_PATH, [
      '--headless=new',
      '--hide-scrollbars',
      `--window-size=${w},${h}`,
      `--screenshot=${pngPath}`,
      url
    ], { stdio: 'pipe' });

    const fileSize = fs.existsSync(pngPath) ? fs.statSync(pngPath).size : 0;
    console.log(`  Screenshot: ${pngPath} (${fileSize} bytes)`);

    let dom = '';
    try {
      dom = execFileSync(EDGE_PATH, [
        '--headless=new',
        '--dump-dom',
        url
      ], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
      dom = e.stdout || '';
    }

    const variantMatch = dom.match(/data-composition-variant="([^"]+)"/);
    const variant = variantMatch ? variantMatch[1] : null;

    const fingerprintMatch = dom.match(/data-structural-fingerprint="([^"]+)"/);
    const fingerprint = fingerprintMatch ? fingerprintMatch[1] : null;

    const hasCanvas = dom.includes('<canvas');
    const hasKazzooLeak = /Emerald Glade|Meridian Ridge|Brambletoad|Whispering Moss/i.test(dom);
    const hasFurnitureLeak = /Timber|Heartwood|Tenon|Kiln Cured|Oakhaven/i.test(dom);
    const hasAstronomyTerms = /Aethelgard|Vespera|Planetary|Observatory|Astrometry|Orbital|Kepler/i.test(dom);
    const hasStrayCss = /lg:col-span-|space-y-|grid-cols-/.test(dom.replace(/<[^>]*>/g, ' '));

    const result = {
      name: t.name,
      port: t.port,
      path: t.path,
      viewport: `${w}x${h}`,
      screenshotPath: pngPath,
      fileSize,
      variant,
      fingerprint,
      hasCanvas,
      hasKazzooLeak,
      hasFurnitureLeak,
      hasAstronomyTerms,
      hasStrayCss,
      domLength: dom.length
    };

    console.log(`  Variant: ${variant || 'none'} | Fingerprint: ${fingerprint || 'none'}`);
    console.log(`  Has Canvas: ${hasCanvas} | Astronomy Terms: ${hasAstronomyTerms}`);
    console.log(`  Kazzoo Leak: ${hasKazzooLeak} | Furniture Leak: ${hasFurnitureLeak} | Stray CSS: ${hasStrayCss}`);
    results.push(result);
  } catch (err) {
    console.error(`  Error capturing ${t.name}:`, err.message);
    results.push({ name: t.name, error: err.message });
  }
}

const summaryFile = path.join(ARTIFACT_DIR, 'celestia-results.json');
fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
console.log(`\nVerification complete! Summary written to ${summaryFile}`);
