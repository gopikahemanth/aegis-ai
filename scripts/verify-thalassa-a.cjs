const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\vishn\\.gemini\\antigravity-ide\\brain\\c314194d-355d-44dc-a2ea-ca54806e9f09\\screenshots\\thalassa_habitat';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const targets = [
  { name: 'thalassa_a_home_1440', port: 4185, path: '/', viewport: [1440, 900] },
  { name: 'thalassa_a_home_768', port: 4185, path: '/', viewport: [768, 1024] },
  { name: 'thalassa_a_home_390', port: 4185, path: '/', viewport: [390, 844] },
  { name: 'thalassa_a_cutaways_1440', port: 4185, path: '/structural-cutaways', viewport: [1440, 900] },
  { name: 'thalassa_a_lighting_1440', port: 4185, path: '/change-lighting', viewport: [1440, 900] },
];

console.log('Capturing Edge screenshots for Thalassa Habitat A...');

for (const t of targets) {
  const url = `http://localhost:${t.port}${t.path}`;
  const [w, h] = t.viewport;
  const pngPath = path.join(ARTIFACT_DIR, `${t.name}.png`);

  console.log(`Capturing: [${t.name}] ${url} @ ${w}x${h}`);
  try {
    execFileSync(EDGE_PATH, [
      '--headless=new',
      '--hide-scrollbars',
      `--window-size=${w},${h}`,
      `--screenshot=${pngPath}`,
      url
    ], { stdio: 'pipe' });

    const size = fs.existsSync(pngPath) ? fs.statSync(pngPath).size : 0;
    console.log(`  ✓ Saved: ${pngPath} (${size} bytes)`);
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
  }
}

console.log('Done capturing Thalassa A.');
