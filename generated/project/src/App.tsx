import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillGrid } from './components/SkillGrid';
import { ProjectGrid } from './components/ProjectGrid';
import { Timeline } from './components/Timeline';
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { projectService } from './services/projectService';
import { Project } from './types/portfolio';

export function App() {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projects = projectService.getAllProjects();
  const skillCategories = projectService.getSkillCategories();
  const experiences = projectService.getExperiences();

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white font-sans">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="flex-grow pt-20">
        <HeroSection
          onExploreWork={() => handleNavigate('projects')}
          onContact={() => handleNavigate('contact')}
        />

        <AboutSection />

        <SkillGrid skillCategories={skillCategories} />

        <ProjectGrid
          projects={projects}
          onSelectProject={(project) => setSelectedProject(project)}
        />

        <Timeline experiences={experiences} />

        <ContactForm />
      </main>

      <Footer />

      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.title}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {selectedProject.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">Release Year: {selectedProject.year}</span>
            </div>

            <p className="text-slate-300 leading-relaxed text-base">
              {selectedProject.description}
            </p>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wider">Architecture & Highlights</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{selectedProject.architectureNotes}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                {selectedProject.metrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-sm font-bold text-indigo-400">{metric.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Technologies Leveraged</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.technologies.map((tech, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-800">
              {selectedProject.githubUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedProject.githubUrl, '_blank')}
                >
                  View Source
                </Button>
              )}
              {selectedProject.liveUrl && (
                <Button
                  size="sm"
                  onClick={() => window.open(selectedProject.liveUrl, '_blank')}
                >
                  Live Deployment
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;