import React from 'react';
import { Briefcase, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { Card } from './Card';

export const ExperienceTimeline: React.FC = () => {
  const experiences = [
    {
      role: 'Principal Software Engineer',
      company: 'Nexus Cloud Technologies',
      period: '2022 — Present',
      location: 'San Francisco, CA (Remote)',
      description: 'Leading architecture for core cloud-native microservices handling 50M+ daily API requests. Spearheaded migration from monolithic architecture to domain-driven microservices.',
      achievements: [
        'Reduced system latency by 42% through Redis caching layers and database query optimization.',
        'Mentored 18 senior and mid-level engineers across frontend and backend disciplines.',
        'Established rigorous CI/CD pipelines and zero-downtime deployment protocols.'
      ]
    },
    {
      role: 'Staff Full-Stack Architect',
      company: 'Quantum AI Labs',
      period: '2020 — 2022',
      location: 'New York, NY',
      description: 'Architected enterprise AI analytics dashboard utilizing React, TypeScript, Python FastAPI, and PostgreSQL. Integrated real-time data streaming via WebSockets.',
      achievements: [
        'Delivered flagship product 2 weeks ahead of schedule, securing $15M Series A funding.',
        'Implemented strict end-to-end type safety and automated testing achieving 94% code coverage.',
        'Optimized frontend rendering performance for complex data visualization graphs.'
      ]
    },
    {
      role: 'Senior Software Engineer',
      company: 'Vanguard Digital Solutions',
      period: '2017 — 2020',
      location: 'Austin, TX',
      description: 'Developed high-traffic e-commerce platforms and financial dashboards serving millions of active global users with robust state management and security.',
      achievements: [
        'Revamped legacy checkout flow resulting in a 28% increase in conversion rates.',
        'Introduced automated accessibility (a11y) auditing into development workflow.',
        'Collaborated directly with UI/UX teams to design a scalable enterprise component library.'
      ]
    }
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
          <Briefcase size={14} /> Career History
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Professional <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Milestones</span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          A track record of engineering leadership, architectural innovation, and high-impact product delivery.
        </p>
      </div>

      <div className="relative border-l border-slate-800 ml-4 sm:ml-8 space-y-12">
        {experiences.map((exp, idx) => (
          <div key={idx} className="relative pl-8 sm:pl-10">
            <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            </div>

            <Card glow className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{exp.role}</h3>
                  <div className="text-indigo-400 font-semibold text-sm">{exp.company}</div>
                </div>
                <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    <Calendar size={13} className="text-indigo-400" /> {exp.period}
                  </span>
                  <span className="flex items-center gap-1.5 pt-1">
                    <MapPin size={13} className="text-slate-500" /> {exp.location}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">{exp.description}</p>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key Achievements</div>
                <ul className="space-y-2">
                  {exp.achievements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};