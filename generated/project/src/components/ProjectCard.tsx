import React from 'react';
import { ExternalLink, Github, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { Card } from './Card';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (
    <Card glow className="flex flex-col justify-between group overflow-hidden">
      <div className="space-y-5">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-indigo-300 shadow-md">
            {project.category}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3
              onClick={() => onSelect(project)}
              className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              {project.title}
              <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
            </h3>
          </div>
          <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{project.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map(tech => (
            <span
              key={tech}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="text-xs px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 font-medium">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onSelect(project)}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          View Case Study →
        </button>
        <div className="flex items-center gap-2">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Github size={16} />
          </a>
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Live Demo"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </Card>
  );
};