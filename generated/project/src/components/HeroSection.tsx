import React from 'react';
import { ArrowRight, Sparkles, Terminal, Code2, Download, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from './Button';
import { SocialLinks } from './SocialLinks';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-indigo-500/10 backdrop-blur-md">
              <Sparkles size={14} className="text-pink-400 animate-pulse" /> Available for Senior Architecture Roles & Consulting
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                Engineering <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Excellence</span> at Scale.
              </h1>
              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-2xl">
                I’m <strong className="text-white font-semibold">Alex Rivers</strong>, a Principal Coder and Software Architect specializing in high-performance distributed systems, resilient cloud infrastructure, and immersive React applications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} />}
                onClick={() => onNavigate('/projects')}
              >
                Explore Projects
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={<Download size={18} />}
                onClick={() => window.open('/resume.pdf', '_blank')}
              >
                Download Resume
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">Connect across networks</div>
              <SocialLinks />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Terminal size={14} className="text-indigo-400" /> principal-spec.ts
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-pink-400">const</span> <span className="text-indigo-300">architect</span> = &#123;
                    <div className="pl-4 space-y-1">
                      <div>name: <span className="text-emerald-300">'Alex Rivers'</span>,</div>
                      <div>role: <span className="text-emerald-300">'Principal Software Engineer'</span>,</div>
                      <div>focus: [<span className="text-emerald-300">'Distributed Systems'</span>, <span className="text-emerald-300">'React 19'</span>, <span className="text-emerald-300">'Cloud Native'</span>],</div>
                      <div>status: <span className="text-emerald-300">'Building production-grade solutions'</span></div>
                    </div>
                    &#125;;
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> System Status</span>
                      <span className="text-emerald-400 font-semibold">100% Operational</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Cpu size={14} className="text-indigo-400" /> Code Quality</span>
                      <span className="text-indigo-300 font-semibold">Strict SOLID / DRY</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-center text-xs"
                    onClick={() => onNavigate('/about')}
                  >
                    View Professional Background →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};