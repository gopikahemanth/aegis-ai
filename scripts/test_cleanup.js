const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const target = path.resolve('generated/project');

console.log('Testing cleanup on target with active server...');
console.log('Target exists before:', fs.existsSync(target));

if (process.platform === 'win32') {
  try {
    const myPid = process.pid;
    const psCommand = `powershell -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne ${myPid} -and ($_.CommandLine -like '*vite*' -or $_.CommandLine -like '*5173*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`;
    execSync(psCommand, { stdio: 'ignore' });
    console.log('Process cleanup command executed successfully.');
  } catch (e) {
    console.log('Process cleanup error:', e.message);
  }
}

try {
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  console.log('rmSync completed successfully! Target exists after:', fs.existsSync(target));
} catch (err) {
  console.error('rmSync threw EPERM:', err);
}
