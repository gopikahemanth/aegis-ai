import React from 'react';

interface SectionHeadingProps {
  badge: string;
  title: string;
  subtitle: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ badge, title, subtitle }) => {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 mb-4 inline-block">
        {badge}
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight mb-4">
        {title}
      </h2>
      <p className="text-slate-400 text-base md:text-lg leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};