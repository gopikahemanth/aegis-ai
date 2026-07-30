import React from 'react';
import { Project } from '../types/portfolio';
import { Card } from './Card';
import { Button } from './Button';

interface ProjectCardProps {
  project: Project;
  onSelectProject: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelectProject }) => {
  return (
    <Card className="flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {project.category}
          </span>
          <span className="text-xs text-slate-500 font-medium">{project.year}</span>
        </div>

        <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-indigo-400 transition-colors">
          {project.title}
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {project.tagline}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          {project.metrics.map((metric, i) => (
            <div key={i} className="text-center">
              <div className="text-xs font-bold text-slate-200">{metric.value}</div>
              <div className="text-[10px] text-slate-500 uppercase">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.slice(0, 3).map((tech, i) => (
            <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800/40 text-slate-500">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onSelectProject(project)}
        >
          View Architecture & Details
        </Button>
      </div>
    </Card>
  );
};