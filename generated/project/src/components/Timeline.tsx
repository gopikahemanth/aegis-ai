import React from 'react';
import { Experience } from '../types/portfolio';
import { SectionHeading } from './SectionHeading';

interface TimelineProps {
  experiences: Experience[];
}

export const Timeline: React.FC<TimelineProps> = ({ experiences }) => {
  return (
    <section id="experience" className="py-24 px-6 border-t border-slate-900">
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          badge="Career History"
          title="Professional Experience"
          subtitle="A track record of technical leadership, architectural modernization, and high-impact engineering delivery."
        />

        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
          {experiences.map((exp, i) => (
            <div key={i} className="relative pl-12">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-950"></div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{exp.role}</h3>
                    <div className="text-indigo-400 font-semibold text-sm mt-0.5">{exp.company}</div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
                    {exp.period}
                  </span>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {exp.description}
                </p>

                <div className="space-y-2 mb-6">
                  {exp.highlights.map((highlight, j) => (
                    <div key={j} className="flex items-start text-xs text-slate-400">
                      <span className="text-indigo-400 mr-2 font-bold">&gt;</span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                  {exp.technologies.map((tech, j) => (
                    <span key={j} className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};