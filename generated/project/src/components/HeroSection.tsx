import React from 'react';
import { Button } from './Button';

interface HeroSectionProps {
  onExploreWork: () => void;
  onContact: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreWork, onContact }) => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Available for Principal & Staff Architectural Roles</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-100 tracking-tight mb-6">
          Engineering High-Scale <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Distributed Systems
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Principal Software Engineer with 10+ years of experience architecting resilient cloud infrastructure, high-throughput microservices, and high-performance applications.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={onExploreWork} className="w-full sm:w-auto">
            Explore Architecture
          </Button>
          <Button variant="outline" size="lg" onClick={onContact} className="w-full sm:w-auto">
            Get in Touch
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-slate-900/80">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-100">10+</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-indigo-400">15M+</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Max RPS Handled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-100">50TB</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Daily Data Flow</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-purple-400">99.999%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">System Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};