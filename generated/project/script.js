// Canvas Neural Matrix Hero Animation
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('matrixCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const nodes = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1.5,
    }));

    let mouse = { x: -1000, y: -1000 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('resize', () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${1 - dist / 130})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        const mDist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
        if (mDist < 160) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${1 - mDist / 160})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  // Start Telemetry Ticker Simulation
  startTelemetryTicker();
});

// Telemetry Stream Simulation
let isStreaming = true;
let mitigatedCount = 148920;
let shieldsCount = 1024;
let latencyVal = 4.2;
let accuracyVal = 99.98;

function startTelemetryTicker() {
  setInterval(() => {
    if (!isStreaming) return;

    mitigatedCount += Math.floor(Math.random() * 12) + 1;
    shieldsCount = 1024 + Math.floor(Math.random() * 5) - 2;
    latencyVal = Number((4.0 + Math.random() * 0.5).toFixed(2));
    accuracyVal = Number((99.95 + Math.random() * 0.04).toFixed(2));

    const mEl = document.getElementById('metricMitigated');
    const sEl = document.getElementById('metricShields');
    const lEl = document.getElementById('metricLatency');
    const aEl = document.getElementById('metricAccuracy');
    const heroMit = document.getElementById('heroStatMitigated');
    const heroLat = document.getElementById('heroStatLatency');

    if (mEl) mEl.textContent = mitigatedCount.toLocaleString();
    if (sEl) sEl.textContent = shieldsCount.toLocaleString();
    if (lEl) lEl.textContent = `${latencyVal} ms`;
    if (aEl) aEl.textContent = `${accuracyVal}%`;
    if (heroMit) heroMit.textContent = mitigatedCount.toLocaleString();
    if (heroLat) heroLat.textContent = `${latencyVal}ms`;
  }, 2000);
}

function toggleStream() {
  isStreaming = !isStreaming;
  const btn = document.getElementById('streamToggleBtn');
  if (btn) {
    btn.textContent = isStreaming ? 'Pause Stream' : 'Resume Stream';
    btn.className = isStreaming 
      ? 'px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors'
      : 'px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors';
  }
}

// Scroll Helper
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// Modal Controls
function openModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function handleAuthSubmit(e) {
  e.preventDefault();
  alert('Neural Authentication Successful! Welcome to Aegis Secure Core.');
  closeModal();
}

// Interactive Terminal Simulator
function handleTerminalInput(e) {
  if (e.key === 'Enter') {
    executeCommand();
  }
}

function executeCommand() {
  const inputEl = document.getElementById('terminalInput');
  const outputEl = document.getElementById('terminalOutput');
  if (!inputEl || !outputEl) return;

  const cmd = inputEl.value.trim();
  if (!cmd) return;

  // Append user command
  const userLine = document.createElement('div');
  userLine.innerHTML = `<span class="text-cyan-400">aegis@kernel:~$</span> ${escapeHtml(cmd)}`;
  outputEl.appendChild(userLine);

  inputEl.value = '';

  // Process response
  const respLine = document.createElement('div');
  respLine.className = 'text-slate-300';

  const lower = cmd.toLowerCase();
  if (lower === 'help') {
    respLine.innerHTML = `Available commands:<br>
      - <span class="text-cyan-400">scan</span>: Run deep vulnerability scan across cluster nodes.<br>
      - <span class="text-cyan-400">shield</span>: Verify status of active neural defense barriers.<br>
      - <span class="text-cyan-400">audit</span>: Generate cryptographically verifiable forensic log.<br>
      - <span class="text-cyan-400">clear</span>: Clear terminal buffer.<br>
      - <span class="text-cyan-400">status</span>: Display core health telemetry.`;
  } else if (lower === 'scan') {
    respLine.innerHTML = `<span class="text-emerald-400">[SCAN COMPLETE]</span> 1,024 microservices inspected. 0 vulnerabilities detected. Zero-day vector defenses active.`;
  } else if (lower === 'shield') {
    respLine.innerHTML = `<span class="text-cyan-400">[SHIELD STATUS]</span> All 1,024 neural barriers operating at optimal resonance. Quantum encryption handshake verified.`;
  } else if (lower === 'audit') {
    respLine.innerHTML = `<span class="text-indigo-400">[AUDIT LOG]</span> Root signature #8942-AEG verified by decentralized consensus ledger at ${new Date().toISOString()}.`;
  } else if (lower === 'status') {
    respLine.innerHTML = `<span class="text-emerald-400">[HEALTH OK]</span> CPU: 12.4% | Memory: 4.1GB / 64GB | Neural Latency: ${latencyVal}ms | Active Threat Mitigation: Online`;
  } else if (lower === 'clear') {
    outputEl.innerHTML = '';
    return;
  } else {
    respLine.innerHTML = `<span class="text-rose-400">[ERROR]</span> Command not recognized: '${escapeHtml(cmd)}'. Type 'help' for available directives.`;
  }

  outputEl.appendChild(respLine);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}