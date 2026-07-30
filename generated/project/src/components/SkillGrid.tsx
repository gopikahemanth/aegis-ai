import React from 'react';
import { SkillCategory } from '../types/portfolio';
import { SkillBadge } from './SkillBadge';
import { SectionHeading } from './SectionHeading';

interface SkillGridProps {
  skillCategories: SkillCategory[];
}

export const SkillGrid: React.FC<SkillGridProps> = ({ skillCategories }) => {
  return (
    <section id="skills" className="py-24 px-6 border-t border-slate-900">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          badge="Expertise"
          title="Technical Competencies"
          subtitle="Core engineering proficiencies refined across high-scale distributed systems and enterprise product delivery."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {skillCategories.map((category, i) => (
            <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-100 mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
                <span>{category.title}</span>
                <span className="text-xs font-normal text-indigo-400">Production Tested</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.skills.map((skill, j) => (
                  <SkillBadge
                    key={j}
                    name={skill.name}
                    level={skill.level}
                    description={skill.description}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};