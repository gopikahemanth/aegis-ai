import { useState } from 'react';
import { useCinematicScroll } from './hooks/useCinematicScroll';
import { Navigation } from './components/Navigation';
import { CanvasBackground } from './components/CanvasBackground';
import { HUDOverlay } from './components/HUDOverlay';
import { BlueprintModal } from './components/BlueprintModal';
import { CockpitModal } from './components/CockpitModal';
import { CustomizerModal } from './components/CustomizerModal';
import { Chapter, CustomizationState } from './types/mecha';
import { audioManager } from './services/audioManager';

const CHAPTERS: Chapter[] = [
  {
    id: 0,
    title: 'PHASE 01: HEAVY HAULER',
    subtitle: 'Autonomous Class-IV chassis locked in transit configuration.',
    description: 'Heavy duty cargo mode optimized for high-speed cross-terrain deployment and secure transport of core reactor payloads.',
    telemetry: { coreTemp: '42.4°C', hydraulicPressure: '3400 PSI', servoVoltage: '24V', stabilityIndex: '99.8%', reactorStatus: 'STABLE', ammoCapacity: '0%' },
    activeRange: [0.0, 0.25],
    keyFeatures: ['Reinforced Titanium Chassis', 'All-Terrain Pneumatic Treads', 'High-Capacity Cargo Bay'],
  },
  {
    id: 1,
    title: 'PHASE 02: KINETIC DEPLOYMENT',
    subtitle: 'Initiating hydraulic decoupling and sub-frame rotation.',
    description: 'Sensors detect combat proximity. Actuators disengage cargo locks, initiating structural unfolding and rapid center-of-gravity shift.',
    telemetry: { coreTemp: '68.9°C', hydraulicPressure: '5800 PSI', servoVoltage: '48V', stabilityIndex: '84.2%', reactorStatus: 'ELEVATED', ammoCapacity: '40%' },
    activeRange: [0.25, 0.55],
    keyFeatures: ['Hydraulic Decoupling', 'Sub-Frame Articulation', 'Dynamic Gyro Balance'],
  },
  {
    id: 2,
    title: 'PHASE 03: BIPEDAL RECONFIGURATION',
    subtitle: 'Spine alignment active. Gyroscopic stabilization engaged.',
    description: 'Spine locking into vertical bipedal orientation. Limb actuators calibrate trajectory vectors for immediate tactical engagement.',
    telemetry: { coreTemp: '89.1°C', hydraulicPressure: '8200 PSI', servoVoltage: '72V', stabilityIndex: '92.5%', reactorStatus: 'OPTIMAL', ammoCapacity: '80%' },
    activeRange: [0.55, 0.85],
    keyFeatures: ['Vertical Spine Lock', 'Bipedal Balance Matrix', 'Target Acquisition Radar'],
  },
  {
    id: 3,
    title: 'PHASE 04: APEX PREDATOR',
    subtitle: 'Combat matrix online. Full humanoid articulation achieved.',
    description: 'Maximum combat capability reached. Integrated plasma weaponry and pulse shielding fully operational for front-line dominance.',
    telemetry: { coreTemp: '104.5°C', hydraulicPressure: '12000 PSI', servoVoltage: '120V', stabilityIndex: '100.0%', reactorStatus: 'PEAK', ammoCapacity: '100%' },
    activeRange: [0.85, 1.0],
    keyFeatures: ['Plasma Cannon Array', 'Active Energy Shields', 'Neural Pilot Link'],
  },
];

export function App() {
  const { scrollProgress, currentFrame, isLoaded, loadingProgress, images } = useCinematicScroll({
    totalFrames: 204,
  });

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [audioMuted, setAudioMuted] = useState(true);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isCockpitOpen, setIsCockpitOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customization, setCustomization] = useState<CustomizationState>({
    primaryColor: '#2563eb',
    accentColor: '#38bdf8',
    visorGlow: '#ef4444',
    armorCoating: 'matte',
    weaponryLoadout: 'standard',
  });

  // Update active chapter based on scroll progress
  if (scrollProgress < 0.25 && activeChapterIndex !== 0) setActiveChapterIndex(0);
  else if (scrollProgress >= 0.25 && scrollProgress < 0.55 && activeChapterIndex !== 1) setActiveChapterIndex(1);
  else if (scrollProgress >= 0.55 && scrollProgress < 0.85 && activeChapterIndex !== 2) setActiveChapterIndex(2);
  else if (scrollProgress >= 0.85 && activeChapterIndex !== 3) setActiveChapterIndex(3);

  const handleToggleAudio = () => {
    const active = audioManager.toggleMute();
    setAudioMuted(!active);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-mono">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-xl font-bold text-blue-400">A</span>
        </div>
        <h1 className="text-xl font-bold mb-2 tracking-widest">INITIALIZING CINEMATIC SEQUENCE</h1>
        <p className="text-xs text-slate-500 mb-6">Generating high-fidelity 204-frame vector assets...</p>
        <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-75"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <div className="text-xs font-mono text-blue-400 mt-3">{loadingProgress}%</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[400vh] bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navigation
        onOpenBlueprint={() => setIsBlueprintOpen(true)}
        onOpenCockpit={() => setIsCockpitOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        audioMuted={audioMuted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Background Frame Sequence Canvas */}
      <CanvasBackground images={images} currentFrame={currentFrame} isLoaded={isLoaded} />

      {/* HUD Overlay strictly bound to scroll progress */}
      <HUDOverlay progress={scrollProgress} chapters={CHAPTERS} activeChapterIndex={activeChapterIndex} />

      {/* Modals */}
      <BlueprintModal isOpen={isBlueprintOpen} onClose={() => setIsBlueprintOpen(false)} />
      <CockpitModal isOpen={isCockpitOpen} onClose={() => setIsCockpitOpen(false)} />
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        customization={customization}
        onChange={setCustomization}
      />
    </div>
  );
}

export default App;