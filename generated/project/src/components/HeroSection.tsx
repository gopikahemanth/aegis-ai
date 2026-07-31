import React, { useEffect, useRef } from 'react';

interface HeroSectionProps {
  onScrollTo: (id: string) => void;
  mitigatedThreats: number;
  accuracyPercentage: number;
  systemLatencyMs: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScrollTo,
  mitigatedThreats,
  accuracyPercentage,
  systemLatencyMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const nodes: Node[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1.5,
    }));

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

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

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center py-28 md:py-32">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Aegis Neural Core v4.2 Online
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Next-Gen AI Security <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Autonomous Defense Grid
          </span>
        </h1>
        <p className="hero-subtitle text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Protecting cloud infrastructure in real-time with self-learning neural algorithms, predictive threat hunting, and lightning-fast autonomous neutralization.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => onScrollTo('terminal')} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer">
            <i className="fa-solid fa-bolt text-cyan-200"></i>
            Initialize Playground
          </button>
          <button onClick={() => onScrollTo('architecture')} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-800 text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
            <i className="fa-solid fa-book-open"></i>
            Explore Architecture
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-900 pt-8">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">{mitigatedThreats.toLocaleString()}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Threats Neutralized</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono">{accuracyPercentage}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Prediction Accuracy</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">{systemLatencyMs}ms</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Response Time</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-indigo-400 font-mono">24/7</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Autonomous Watch</div>
          </div>
        </div>
      </div>
    </section>
  );
};