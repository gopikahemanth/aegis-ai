const { execSync } = require('child_process');

function killLockingProcesses(port = 5173) {
  if (process.platform !== 'win32') return;
  
  // 1. Instant TCP listener kill via netstat + taskkill
  try {
    const netstatOut = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = netstatOut.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid)) && Number(pid) !== process.pid && Number(pid) !== process.ppid) {
          console.log(`Found listening PID ${pid} on port ${port}. Killing...`);
          try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
        }
      }
    }
  } catch (e) {
    console.error('netstat error:', e.message);
  }

  // 2. Safe PowerShell query on node processes
  try {
    const psScript = `
      $currentPid = ${process.pid};
      $parentPid = ${process.ppid};
      Get-Process node -ErrorAction SilentlyContinue | Where-Object {
        $_.Id -ne $currentPid -and $_.Id -ne $parentPid
      } | ForEach-Object {
        try {
          $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue
          if ($proc.CommandLine -and ($proc.CommandLine -like "*vite*" -or $proc.CommandLine -like "*5173*")) {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
          }
        } catch {}
      }
    `;
    const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
    execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${b64}`, { stdio: 'ignore' });
  } catch (e) {
    console.error('powershell cleanup error:', e.message);
  }
}

console.log('Testing killLockingProcesses...');
killLockingProcesses(5173);
console.log('killLockingProcesses completed cleanly!');
