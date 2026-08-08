import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

console.log('🚀 Starting Fullstack Application (Express Backend + Vite Frontend)...');

const isWin = process.platform === 'win32';

const backend = spawn(isWin ? 'npx.cmd' : 'npx', ['tsx', 'server/index.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: isWin,
  env: { ...process.env, PORT: '5000' }
});

const frontend = spawn(isWin ? 'npx.cmd' : 'npx', ['vite'], {
  cwd: root,
  stdio: 'inherit',
  shell: isWin,
  env: { ...process.env, PORT: '5173' }
});

const cleanup = () => {
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
