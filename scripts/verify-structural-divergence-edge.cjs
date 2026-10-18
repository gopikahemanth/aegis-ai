const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\vishn\\.gemini\\antigravity-ide\\brain\\c314194d-355d-44dc-a2ea-ca54806e9f09\\screenshots\\structural_divergence';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const targets = [
  // Kazzoo verification
  {
    project: 'Kazzoo',
    port: 4173,
    path: '/family-adventures',
    name: 'kazzoo_family_adventures_1440',
    viewport: [1440, 900],
    capability: 'SCROLL_STORY',
    expectedVariant: 'docked_left_rail'
  },
  {
    project: 'Kazzoo',
    port: 4173,
    path: '/print-journey-scroll',
    name: 'kazzoo_print_journey_scroll_1440',
    viewport: [1440, 900],
    capability: 'SCROLL_STORY',
    expectedVariant: 'horizontal_timeline'
  },
  {
    project: 'Kazzoo',
    port: 4173,
    path: '/inspect-character-bio',
    name: 'kazzoo_character_bio_1440',
    viewport: [1440, 900],
    capability: 'WORKSPACE_TOOL',
    checkNoStrayCss: true
  },
  {
    project: 'Kazzoo',
    port: 4173,
    path: '/quest-progression',
    name: 'kazzoo_quest_progression_390',
    viewport: [390, 844],
    capability: 'SPATIAL_MAP',
    checkMobileOverflow: true
  },
  // Atelier Oakhaven (Luxury Furniture) verification
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/',
    name: 'oakhaven_3d_turntable_1440',
    viewport: [1440, 900],
    capability: 'IMMERSIVE_3D',
    expectedVariant: 'gallery_showcase',
    checkNoEmeraldLeak: true
  },
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/joinery-chronicle',
    name: 'oakhaven_joinery_chronicle_1440',
    viewport: [1440, 900],
    capability: 'SCROLL_STORY',
    expectedVariant: 'horizontal_timeline'
  },
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/timber-provenance',
    name: 'oakhaven_timber_provenance_1440',
    viewport: [1440, 900],
    capability: 'SPATIAL_MAP',
    expectedVariant: 'split_dossier',
    checkTimberWaypoints: true
  },
  // Tablet and Mobile viewports
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/timber-provenance',
    name: 'oakhaven_timber_provenance_768',
    viewport: [768, 1024],
    capability: 'SPATIAL_MAP'
  },
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/timber-provenance',
    name: 'oakhaven_timber_provenance_390',
    viewport: [390, 844],
    capability: 'SPATIAL_MAP',
    checkMobileOverflow: true
  },
  {
    project: 'Atelier Oakhaven',
    port: 4175,
    path: '/',
    name: 'oakhaven_3d_turntable_390',
    viewport: [390, 844],
    capability: 'IMMERSIVE_3D',
    checkMobileOverflow: true
  }
];

console.log('Starting Edge Browser Structural Verification...');
const results = [];

for (const t of targets) {
  const url = `http://localhost:${t.port}${t.path}`;
  const [w, h] = t.viewport;
  const pngPath = path.join(ARTIFACT_DIR, `${t.name}.png`);

  console.log(`\nTesting: [${t.project}] ${t.path} @ ${w}x${h}`);

  try {
    // 1. Capture Screenshot
    execFileSync(EDGE_PATH, [
      '--headless=new',
      '--hide-scrollbars',
      `--window-size=${w},${h}`,
      `--screenshot=${pngPath}`,
      url
    ], { stdio: 'pipe' });

    const fileSize = fs.existsSync(pngPath) ? fs.statSync(pngPath).size : 0;
    console.log(`  Screenshot: ${pngPath} (${fileSize} bytes)`);

    // 2. Dump DOM
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

    // 3. Inspections
    const variantMatch = dom.match(/data-composition-variant="([^"]+)"/);
    const variant = variantMatch ? variantMatch[1] : null;

    const fingerprintMatch = dom.match(/data-structural-fingerprint="([^"]+)"/);
    const fingerprint = fingerprintMatch ? fingerprintMatch[1] : null;

    const experienceMatch = dom.match(/data-aegis-experience="([^"]+)"/);
    const experience = experienceMatch ? experienceMatch[1] : null;

    // Check stray CSS
    const hasStrayCss = /lg:col-span-|space-y-|grid-cols-|gap-/.test(
      // Only match outside tags
      dom.replace(/<[^>]*>/g, ' ')
    );

    // Check Emerald Glade leak
    const hasEmeraldLeak = /Emerald Glade|Meridian Ridge/i.test(dom);

    // Check timber waypoints
    const hasTimberWaypoints = /Oak Reserve|Kiln Curing|Tenon Joinery/i.test(dom);

    const result = {
      name: t.name,
      project: t.project,
      path: t.path,
      viewport: `${w}x${h}`,
      screenshotPath: pngPath,
      fileSize,
      experience,
      variant,
      fingerprint,
      hasStrayCss,
      hasEmeraldLeak,
      hasTimberWaypoints,
      domLength: dom.length
    };

    console.log(`  Variant: ${variant || 'none'} | Fingerprint: ${fingerprint || 'none'}`);
    console.log(`  Stray CSS text: ${hasStrayCss} | Emerald leak: ${hasEmeraldLeak}`);
    results.push(result);
  } catch (err) {
    console.error(`  Failed to capture:`, err.message);
    results.push({ name: t.name, error: err.message });
  }
}

const summaryFile = path.join(ARTIFACT_DIR, 'verification-results.json');
fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
console.log(`\nVerification complete! Results written to ${summaryFile}`);
