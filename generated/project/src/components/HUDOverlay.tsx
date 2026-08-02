import React from 'react';
import { Chapter } from '../types/mecha';

interface HUDOverlayProps {
  progress: number;
  chapters: Chapter[];
  activeChapterIndex: number;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ progress, chapters, activeChapterIndex }) => {
  const currentChapter = chapters[activeChapterIndex] || chapters[0];
  const percentage = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
      {/* Top HUD Telemetry Bar */}
      <div className="flex items-start justify-between">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl pointer-events-auto max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-blue-400 tracking-wider">LIVE TELEMETRY FEED</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-slate-300">
            <div>CORE TEMP:</div>
            <div className="text-right text-slate-100 font-semibold">{currentChapter.telemetry.coreTemp}</div>
            <div>HYDRAULICS:</div>
            <div className="text-right text-slate-100 font-semibold">{currentChapter.telemetry.hydraulicPressure}</div>
            <div>SERVO VOLT:</div>
            <div className="text-right text-slate-100 font-semibold">{currentChapter.telemetry.servoVoltage}</div>
            <div>STABILITY:</div>
            <div className="text-right text-emerald-400 font-semibold">{currentChapter.telemetry.stabilityIndex}</div>
          </div>
        </div>

        {/* Big Progress Indicator */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-6 py-4 shadow-xl text-right">
          <div className="text-[10px] font-mono text-slate-500 tracking-widest">TRANSFORMATION</div>
          <div className="text-3xl font-extrabold font-mono text-slate-100">{percentage}%</div>
          <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r.from-blue-500 to-indigo-500 transition-all duration-150 bg-blue-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Chapter Banner */}
      <div className="flex items-end justify-between">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl pointer-events-auto max-w-xl">
          <div className="inline-block px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-mono mb-3">
            {currentChapter.title}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-2 font-mono">
            {currentChapter.subtitle}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            {currentChapter.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {currentChapter.keyFeatures.map((feat, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
                ✓ {feat}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden lg:block bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 text-right">
          <span className="text-[10px] font-mono text-slate-500 block">SCROLL POSITION</span>
          <span className="text-sm font-mono text-slate-300 font-bold">FRAME {Math.round(progress * 203)} / 204</span>
        </div>
      </div>
    </div>
  );
};