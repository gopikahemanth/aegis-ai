import React, { useState, useRef } from 'react';

interface CodePreviewTerminalProps {
  systemLatencyMs: number;
}

export const CodePreviewTerminal: React.FC<CodePreviewTerminalProps> = ({ systemLatencyMs }) => {
  const terminalOutputRef = useRef<HTMLDivElement | null>(null);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ type: 'user' | 'info' | 'success' | 'error' | 'cyan' | 'indigo'; text: string }>
  >([
    { type: 'cyan', text: 'aegis@kernel:~$ aegis-cli init --cluster=enterprise-us-east' },
    { type: 'info', text: '[INFO] Initializing Aegis Neural Defense Matrix v4.2...' },
    { type: 'info', text: '[INFO] Loading threat signatures from decentralized ledgers...' },
    { type: 'success', text: '[SUCCESS] 1,024 cluster nodes secured and monitored.' },
    { type: 'cyan', text: 'aegis@kernel:~$ status' },
  ]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, { type: 'user' as const, text: `aegis@kernel:~$ ${cmd}` }];
    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      newHistory.push({ type: 'info', text: 'Available commands: scan, shield, audit, status, clear' });
    } else if (lower === 'scan') {
      newHistory.push({ type: 'success', text: '[SCAN COMPLETE] 1,024 microservices inspected. 0 vulnerabilities detected.' });
    } else if (lower === 'shield') {
      newHistory.push({ type: 'cyan', text: '[SHIELD STATUS] All 1,024 neural barriers operational at optimal resonance.' });
    } else if (lower === 'audit') {
      newHistory.push({ type: 'indigo', text: `[AUDIT LOG] Root signature #8942-AEG verified at ${new Date().toISOString()}` });
    } else if (lower === 'status') {
      newHistory.push({ type: 'success', text: `[HEALTH OK] CPU: 12.4% | Memory: 4.1GB | Latency: ${systemLatencyMs}ms` });
    } else if (lower === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else {
      newHistory.push({ type: 'error', text: `[ERROR] Command not recognized: '${cmd}'. Type 'help' for available directives.` });
    }

    setTerminalHistory(newHistory);
    setTerminalInput('');

    setTimeout(() => {
      if (terminalOutputRef.current) {
        terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
      }
    }, 50);
  };

  return (
    <section id="terminal" className="py-24 bg-slate-900/30 border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Interactive Playground</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">Simulate Aegis Defense Core</h2>
          <p className="text-slate-400">Run diagnostic commands against simulated cluster threats in real-time.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="ml-3 text-xs font-mono text-slate-400">aegis-core-terminal@us-east-1:~</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-xs font-mono text-cyan-400">SECURE SHELL</span>
            </div>
          </div>

          <div ref={terminalOutputRef} className="p-6 font-mono text-sm text-slate-300 h-80 overflow-y-auto space-y-3">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className={
                item.type === 'user' ? 'text-cyan-400 font-bold' :
                item.type === 'success' ? 'text-emerald-400' :
                item.type === 'error' ? 'text-rose-400' :
                item.type === 'indigo' ? 'text-indigo-400' :
                item.type === 'cyan' ? 'text-cyan-300' : 'text-slate-400'
              }>
                {item.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleTerminalSubmit} className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center gap-3">
            <span className="text-cyan-400 font-mono font-bold">$</span>
            <input 
              type="text" 
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type command (e.g., 'scan', 'shield', 'audit', 'help')..." 
              className="w-full bg-transparent border-none text-slate-100 font-mono text-sm focus:outline-none placeholder-slate-600"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer">
              Run
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};