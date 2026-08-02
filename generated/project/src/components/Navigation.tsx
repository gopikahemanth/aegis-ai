import React from 'react';

interface NavigationProps {
  onOpenBlueprint: () => void;
  onOpenCockpit: () => void;
  onOpenCustomizer: () => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenBlueprint,
  onOpenCockpit,
  onOpenCustomizer,
  audioMuted,
  onToggleAudio,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/60 backdrop-blur-xl border-b border-slate-800/80">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <span className="font-mono font-black text-white text-base tracking-tighter">A</span>
        </div>
        <div>
          <span className="font-mono font-bold text-sm tracking-widest text-slate-100 block">AEGIS-IV</span>
          <span className="text-[10px] font-mono text-blue-400 tracking-wider block">TACTICAL MECHA SYS</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenBlueprint}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-blue-500/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open Blueprint Analysis"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>BLUEPRINTS</span>
        </button>

        <button
          onClick={onOpenCockpit}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-indigo-500/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open Cockpit Simulator"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>COCKPIT</span>
        </button>

        <button
          onClick={onOpenCustomizer}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all duration-200 flex items-center gap-2 shadow-sm hover:border-amber-500/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label="Open Customizer Suite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>CUSTOMIZE</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-all duration-200 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={audioMuted ? "Unmute audio feedback" : "Mute audio feedback"}
        >
          {audioMuted ? (
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};