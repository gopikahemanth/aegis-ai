import React from 'react';
import { Code2, Heart, ArrowUp } from 'lucide-react';
import { SocialLinks } from './SocialLinks';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between border-b border-slate-800/80 pb-12">
          <div className="md:col-span-6 space-y-3">
            <div
              onClick={() => { onNavigate('/'); scrollToTop(); }}
              className="flex items-center gap-3 cursor-pointer group w-fit"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Code2 size={22} />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  Alex Rivers
                </span>
                <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Principal Coder</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Architecting production-ready software solutions with clean code, modern TypeScript, and robust cloud infrastructure.
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col md:items-end space-y-4">
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">Connect Online</div>
            <SocialLinks />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Alex Rivers. All rights reserved. Built with React 19 & Tailwind CSS.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};