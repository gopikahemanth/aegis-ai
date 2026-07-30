import React from 'react';
import { Code2, Server, Database, Cloud, Wrench, Shield } from 'lucide-react';
import { Card } from './Card';

export const SkillsSection: React.FC = () => {
  const skillCategories = [
    {
      icon: <Code2 className="text-indigo-400" size={20} />,
      title: 'Frontend Architecture',
      skills: ['React 19', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux Toolkit', 'Zustand', 'Vite', 'HTML5/CSS3']
    },
    {
      icon: <Server className="text-emerald-400" size={20} />,
      title: 'Backend Engineering',
      skills: ['Node.js', 'Express', 'Python', 'FastAPI', 'GraphQL', 'RESTful APIs', 'Microservices', 'WebSockets']
    },
    {
      icon: <Database className="text-pink-400" size={20} />,
      title: 'Databases & Caching',
      skills: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma ORM', 'Supabase', 'Elasticsearch', 'SQL Optimization']
    },
    {
      icon: <Cloud className="text-amber-400" size={20} />,
      title: 'Cloud & DevOps',
      skills: ['AWS (Lambda, S3, ECS)', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Terraform', 'Vercel', 'Linux']
    },
    {
      icon: <Wrench className="text-cyan-400" size={20} />,
      title: 'Testing & Tooling',
      skills: ['Jest', 'Vitest', 'Cypress', 'Playwright', 'Git / GitHub', 'Webpack', 'ESLint', 'Prettier']
    },
    {
      icon: <Shield className="text-rose-400" size={20} />,
      title: 'Practices & Methodologies',
      skills: ['Clean Architecture', 'SOLID Principles', 'Test-Driven Development', 'Agile / Scrum', 'Code Reviews', 'Security Audits']
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
          <Code2 size={14} /> Technical Stack
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Comprehensive <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Engineering Arsenal</span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          A curated ecosystem of modern languages, frameworks, and cloud infrastructure tools mastered over a decade of production work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skillCategories.map((category, idx) => (
          <Card key={idx} glow className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md">
                {category.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{category.title}</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};