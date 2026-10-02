const { spawn, execSync } = require('child_process');
const { existsSync, mkdirSync, writeFileSync, openSync } = require('fs');
const { resolve } = require('path');
const http = require('http');

async function main() {
  const targetDir = resolve(__dirname, '../generated/project');
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Write files to ensure dirty state
  writeFileSync(resolve(targetDir, 'dirty-marker.json'), JSON.stringify({ dirty: true }));
  console.log('[Test] Created dirty target directory with files at:', targetDir);

  // Spawn a real HTTP server on port 5173 holding a file descriptor inside targetDir
  const lockFilePath = resolve(targetDir, 'lockfile.bin');
  const lockServerCode = `
    const http = require('http');
    const fs = require('fs');
    const fd = fs.openSync('${lockFilePath.replace(/\\/g, '\\\\')}', 'w');
    fs.writeSync(fd, 'locked by active server');
    const server = http.createServer((req, res) => res.end('live dev server'));
    server.listen(5173, '127.0.0.1', () => {
      console.log('LOCKED_SERVER_READY');
    });
  `;

  console.log('[Test] Spawning mock dev server listening on 5173 holding open file handle...');
  const child = spawn(process.execPath, ['-e', lockServerCode], {
    detached: false,
    stdio: ['ignore', 'pipe', 'inherit']
  });

  await new Promise((resolve, reject) => {
    child.stdout.on('data', (data) => {
      if (data.toString().includes('LOCKED_SERVER_READY')) {
        console.log('[Test] Confirmed mock server is running with open handle on 5173!');
        resolve();
      }
    });
    child.on('error', reject);
    setTimeout(() => reject(new Error('Timeout waiting for mock server')), 5000);
  });

  // Verify port 5173 is indeed listening
  const netstatCheck = execSync('netstat -ano -p tcp | findstr :5173', { encoding: 'utf8' });
  console.log('[Test] Verified active listener on port 5173:\n' + netstatCheck.trim());

  // Now run the cleanDirectory utility from project-builder
  console.log('[Test] Running cleanDirectory() against the locked directory...');
  const { cleanDirectory } = require('../packages/project-builder/dist/utils/clean-directory');
  
  cleanDirectory(targetDir);

  // Verify targetDir is removed or empty and port 5173 is freed
  const existsAfter = existsSync(targetDir);
  console.log('[Test] Target directory exists after cleanDirectory:', existsAfter);
  
  let port5173StillListening = false;
  try {
    const checkAfter = execSync('netstat -ano -p tcp | findstr :5173', { encoding: 'utf8' });
    if (checkAfter.includes('LISTENING')) {
      port5173StillListening = true;
    }
  } catch {
    // findstr returned 1 -> no matches -> port freed!
  }

  console.log('[Test] Port 5173 still listening:', port5173StillListening);

  if (!port5173StillListening && (!existsAfter || require('fs').readdirSync(targetDir).length === 0)) {
    console.log('✅ TEST PASSED: Locked server was cleanly terminated and dirty locked directory was eliminated!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Target directory still locked or port still bound.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
