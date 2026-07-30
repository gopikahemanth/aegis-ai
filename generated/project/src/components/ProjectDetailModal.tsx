import React from 'react';
import { ExternalLink, Github, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { Project } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, isOpen, onClose }) => {
  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.title}>
      <div className="space-y-8">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-indigo-300">
              {project.category}
            </span>
            <div className="flex items-center gap-3">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-xs font-semibold"
              >
                <ExternalLink size={16} /> Live Demo
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xl font-bold text-white">Project Overview</h4>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            {project.fullDescription}
          </p>
        </div>

        {project.metrics && project.metrics.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <BarChart3 size={16} /> Key Metrics & Impact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {project.metrics.map(metric => (
                <div key={metric.label} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <div className="text-2xl font-extrabold text-white">{metric.value}</div>
                  <div className="text-xs text-slate-400 uppercase">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} /> Key Challenges
            </h4>
            <ul className="space-y-2.5">
              {project.challenges.map((challenge, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} /> Architectural Solutions
            </h4>
            <ul className="space-y-2.5">
              {project.solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Technologies Utilized</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map(tech => (
              <span key={tech} className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close Case Study
          </Button>
        </div>
      </div>
    </Modal>
  );
};