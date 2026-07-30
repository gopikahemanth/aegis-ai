import React from 'react';
import { User, Award, ShieldCheck, Cpu, Code2, Globe } from 'lucide-react';
import { Card } from './Card';

export const AboutSection: React.FC = () => {
  const highlights = [
    {
      icon: <Cpu className="text-indigo-400" size={24} />,
      title: 'Architectural Rigor',
      description: 'Designing modular, scalable systems adhering strictly to SOLID, DRY, and Clean Architecture principles.'
    },
    {
      icon: <ShieldCheck className="text-emerald-400" size={24} />,
      title: 'Production-Ready Code',
      description: 'Writing robust, secure, and performant software with zero technical debt or placeholder shortcuts.'
    },
    {
      icon: <Globe className="text-pink-400" size={24} />,
      title: 'Cloud & Distributed',
      description: 'Extensive expertise in microservices, Kubernetes, AWS/GCP infrastructure, and CI/CD pipelines.'
    },
    {
      icon: <Award className="text-amber-400" size={24} />,
      title: 'Technical Leadership',
      description: 'Mentoring engineering teams, conducting code reviews, and driving engineering best practices.'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <User size={14} /> Professional Profile
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Driven by <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Engineering Craftsmanship</span>
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Over the past decade, I have led engineering teams at high-growth startups and enterprise tech companies, architecting cloud-native solutions that handle millions of requests daily.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            My approach combines meticulous attention to code quality, automated testing, and intuitive user experiences. Whether building real-time collaboration tools or AI-driven analytics platforms, I ensure every system is resilient and maintainable.
          </p>
          <div className="pt-4 grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-3xl font-extrabold text-white">10+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Years Experience</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-3xl font-extrabold text-white">50+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Shipped Products</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {highlights.map((item, idx) => (
            <Card key={idx} glow className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};