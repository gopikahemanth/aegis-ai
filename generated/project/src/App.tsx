import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ExperienceTimeline } from './components/ExperienceTimeline';
import { ProjectGrid } from './components/ProjectGrid';
import { ContactForm } from './components/ContactForm';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { Project } from './types';
import { projectService } from './services/projectService';
import { analyticsService } from './services/analyticsService';
import { ArrowRight, Sparkles, Terminal, Code2, FolderGit2 } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path === '' ? '/' : path);
      analyticsService.trackPageView(path);
    };

    window.addEventListener('popstate', handlePopState);
    const initialPath = window.location.pathname || '/';
    setCurrentRoute(initialPath);
    analyticsService.trackPageView(initialPath);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    analyticsService.trackPageView(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allProjects = projectService.getAllProjects();
  const featuredProjects = projectService.getFeaturedProjects();

  const renderRoute = () => {
    switch (currentRoute) {
      case '/':
        return (
          <div className="space-y-20 animate-fadeIn">
            <HeroSection onNavigate={handleNavigate} />
            
            <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                    <FolderGit2 size={14} /> Featured Work
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Transformative <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Engineering Projects</span>
                  </h2>
                </div>
                <Button
                  variant="outline"
                  icon={<ArrowRight size={16} />}
                  onClick={() => handleNavigate('/projects')}
                >
                  View All Projects ({allProjects.length})
                </Button>
              </div>

              <ProjectGrid
                projects={featuredProjects}
                onSelectProject={(project) => setSelectedProject(project)}
              />
            </section>

            <AboutSection />
            <ExperienceTimeline />

            <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16">
              <ContactForm />
            </section>
          </div>
        );

      case '/about':
        return (
          <div className="pt-28 pb-20 space-y-16 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                <Sparkles size={14} /> About Alex Rivers
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                Principal Coder & <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Cloud Strategist</span>
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
                Dedicated to building robust, accessible, and high-performance software that solves complex business problems.
              </p>
            </div>
            <AboutSection />
            <ExperienceTimeline />
            <SkillsSection />
          </div>
        );

      case '/projects':
        return (
          <div className="pt-28 pb-20 max-w-7xl mx-auto px-6 sm:px-8 space-y-12 animate-fadeIn">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                <Terminal size={14} /> Portfolio Archive
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                All Engineering <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Case Studies</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg">
                Explore complete full-stack applications, AI platforms, and distributed systems architecture.
              </p>
            </div>

            <ProjectGrid
              projects={allProjects}
              onSelectProject={(project) => setSelectedProject(project)}
            />
          </div>
        );

      case '/contact':
        return (
          <div className="pt-28 pb-20 max-w-5xl mx-auto px-6 sm:px-8 animate-fadeIn">
            <ContactForm />
          </div>
        );

      default:
        return (
          <div className="pt-36 pb-32 text-center space-y-6 max-w-xl mx-auto px-6 animate-fadeIn">
            <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 w-fit mx-auto text-indigo-400">
              <Code2 size={48} />
            </div>
            <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
            <p className="text-slate-400 text-base">
              The requested routing path does not exist in this portfolio system.
            </p>
            <div className="pt-4">
              <Button onClick={() => handleNavigate('/')}>Return to Home</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout currentRoute={currentRoute} onNavigate={handleNavigate}>
      {renderRoute()}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
      />
    </Layout>
  );
}

export default App;