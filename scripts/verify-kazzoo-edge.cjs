const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\vishn\\.gemini\\antigravity-ide\\brain\\c314194d-355d-44dc-a2ea-ca54806e9f09\\screenshots\\kazzoo';
const BASE_URL = 'http://localhost:4173';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const routesToTest = [
  {
    path: '/',
    name: '01_world_stage_desktop',
    width: 1440,
    height: 900,
    label: 'Home / 3D World Stage (Desktop)'
  },
  {
    path: '/',
    name: '01_world_stage_tablet',
    width: 768,
    height: 1024,
    label: 'Home / 3D World Stage (Tablet)'
  },
  {
    path: '/',
    name: '01_world_stage_mobile',
    width: 390,
    height: 844,
    label: 'Home / 3D World Stage (Mobile)'
  },
  {
    path: '/quest-progression',
    name: '02_quest_progression_desktop',
    width: 1440,
    height: 900,
    label: 'Quest Progression / Spatial Lore Map (Desktop)'
  },
  {
    path: '/quest-progression',
    name: '02_quest_progression_mobile',
    width: 390,
    height: 844,
    label: 'Quest Progression / Spatial Lore Map (Mobile)'
  },
  {
    path: '/inspect-character-bio',
    name: '03_character_bio_desktop',
    width: 1440,
    height: 900,
    label: 'Character Bio Spotlight (Desktop)'
  },
  {
    path: '/inspect-character-bio',
    name: '03_character_bio_mobile',
    width: 390,
    height: 844,
    label: 'Character Bio Spotlight (Mobile)'
  },
  {
    path: '/play-whimsical-sounds',
    name: '04_whimsical_sounds_desktop',
    width: 1440,
    height: 900,
    label: 'Whimsical Sounds Synthesizer (Desktop)'
  },
  {
    path: '/play-whimsical-sounds',
    name: '04_whimsical_sounds_mobile',
    width: 390,
    height: 844,
    label: 'Whimsical Sounds Synthesizer (Mobile)'
  },
  {
    path: '/family-adventures',
    name: '05_family_adventures_desktop',
    width: 1440,
    height: 900,
    label: 'Family Adventures Scrollytelling (Desktop)'
  },
  {
    path: '/family-adventures',
    name: '05_family_adventures_mobile',
    width: 390,
    height: 844,
    label: 'Family Adventures Scrollytelling (Mobile)'
  },
  {
    path: '/parentaldashboard',
    name: '06_parental_dashboard_desktop',
    width: 1440,
    height: 900,
    label: 'Parental Dashboard (Desktop)'
  },
  {
    path: '/print-journey-scroll',
    name: '07_print_journey_scroll_desktop',
    width: 1440,
    height: 900,
    label: 'Print Journey Scroll Folio (Desktop)'
  }
];

const results = [];

for (const target of routesToTest) {
  const url = `${BASE_URL}${target.path}`;
  const screenshotFile = path.join(ARTIFACT_DIR, `${target.name}.png`);
  console.log(`\n========================================`);
  console.log(`Capturing: ${target.label} (${target.width}x${target.height})`);
  console.log(`URL: ${url}`);

  try {
    // 1. Capture screenshot
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

    // 2. Dump DOM
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

    // Inspect DOM
    const hasSafeFallback = dom.includes('SafeFallback') || dom.includes('Loading module interface');
    const hasPlaceholder = dom.toLowerCase().includes('lorem ipsum') || dom.toLowerCase().includes('placeholder');
    const hasAegisExperience = dom.includes('__AEGIS_EXPERIENCE__') || dom.includes('data-aegis') || dom.includes('data-workspace') || dom.includes('data-scene');
    const hasCanvas = dom.includes('<canvas');
    const domLength = dom.length;

    // Check specific experience keywords
    const keywordsFound = [];
    ['telemetry', 'lore', 'sound', 'chapter', 'parental', 'companion', 'quest', 'scroll'].forEach(kw => {
      if (dom.toLowerCase().includes(kw)) keywordsFound.push(kw);
    });

    results.push({
      target: target.name,
      label: target.label,
      path: target.path,
      viewport: `${target.width}x${target.height}`,
      screenshotFile,
      screenshotSize: size,
      domLength,
      hasSafeFallback,
      hasPlaceholder,
      hasAegisExperience,
      hasCanvas,
      keywordsFound
    });

    console.log(`DOM length: ${domLength} chars | SafeFallback: ${hasSafeFallback} | AegisExperience: ${hasAegisExperience} | Canvas: ${hasCanvas}`);
  } catch (err) {
    console.error(`Error processing ${target.label}:`, err.message);
    results.push({
      target: target.name,
      label: target.label,
      path: target.path,
      error: err.message
    });
  }
}

fs.writeFileSync(path.join(ARTIFACT_DIR, 'verification_summary.json'), JSON.stringify(results, null, 2));
console.log('\nVerification complete. Summary saved to verification_summary.json');
