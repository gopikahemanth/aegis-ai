import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { MetricsDashboard } from './components/MetricsDashboard';
import { FeatureMatrix } from './components/FeatureMatrix';
import { CodePreviewTerminal } from './components/CodePreviewTerminal';
import { ArchitectureShowcase } from './components/ArchitectureShowcase';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { DocumentationViewer } from './components/DocumentationViewer';
import { InteractivePlayground } from './components/InteractivePlayground';
import { EnterprisePage } from './components/EnterprisePage';
import { useAegisMetrics } from './hooks/useAegisMetrics';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { metrics, isStreaming, toggleStreaming } = useAegisMetrics();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <BrowserRouter>
      <div className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black overflow-x-hidden min-h-screen flex flex-col justify-between">
        <Navigation onOpenModal={() => setIsModalOpen(true)} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection 
                  onScrollTo={scrollToSection} 
                  mitigatedThreats={metrics.mitigatedThreats}
                  accuracyPercentage={metrics.accuracyPercentage}
                  systemLatencyMs={metrics.systemLatencyMs}
                />
                <MetricsDashboard 
                  metrics={metrics}
                  isStreaming={isStreaming}
                  onToggleStreaming={toggleStreaming}
                />
                <FeatureMatrix />
                <CodePreviewTerminal systemLatencyMs={metrics.systemLatencyMs} />
                <ArchitectureShowcase />
                <CallToAction 
                  onOpenModal={() => setIsModalOpen(true)} 
                  onScrollTo={scrollToSection} 
                />
              </>
            } />
            <Route path="/docs" element={<DocumentationViewer />} />
            <Route path="/playground" element={<InteractivePlayground />} />
            <Route path="/enterprise" element={<EnterprisePage onOpenModal={() => setIsModalOpen(true)} />} />
          </Routes>
        </main>

        <Footer />
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;