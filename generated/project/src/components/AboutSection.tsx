import React from 'react';
import { SectionHeading } from './SectionHeading';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 px-6 border-t border-slate-900">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          badge="Background"
          title="Architecting for Scale & Reliability"
          subtitle="Passionate about building bulletproof distributed systems and empowering engineering teams to deliver exceptional software."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 font-bold text-lg">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">System Architecture</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Specializing in microservices, distributed consensus, event-driven architectures, and high-throughput data pipelines.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 uppercase">
              Fault Tolerant Design
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Engineering Excellence</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Advocating for rigorous CI/CD pipelines, automated testing, comprehensive observability, and zero-downtime deployments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-purple-400 uppercase">
              Rigorous Standards
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 font-bold text-lg">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Team Leadership</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Mentoring engineers, setting technical strategy, authoring RFC standards, and aligning architecture with business goals.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-pink-400 uppercase">
              Mentorship & Culture
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};