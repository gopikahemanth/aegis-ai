const fs = require('fs');
const path = require('path');
const { GenericExperienceGenerator } = require('../packages/ai-core/dist/design/experience-generators/generic-experience-generator.js');
const { CompositionVariantResolver } = require('../packages/ai-core/dist/design/composition-variant-resolver.js');

const PROMPT = "Create an immersive 3D astronomy observatory called Celestia Nocturne. Explore a realistic miniature planetary system in WebGL, inspect planets and moons, adjust orbital speed, switch between observation modes, discover celestial objects, view scientific facts, and navigate a guided cosmic journey. Visual direction: elegant midnight observatory, deep indigo-black space, subtle silver typography, warm telescope-metal details, cinematic lighting, sophisticated scientific editorial design. Avoid generic SaaS dashboards, ordinary card grids, and conventional hero-section layouts. The 3D environment should be the primary experience.";

const kazzooDir = path.resolve(__dirname, '../projects/kazzoo-a');

function setupProject(projectName, seed) {
  const projectDir = path.resolve(__dirname, `../projects/${projectName}`);
  const srcDir = path.join(projectDir, 'src');
  const pagesDir = path.join(srcDir, 'pages');

  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  // Copy build configs
  fs.copyFileSync(path.join(kazzooDir, 'vite.config.ts'), path.join(projectDir, 'vite.config.ts'));
  fs.copyFileSync(path.join(kazzooDir, 'tsconfig.json'), path.join(projectDir, 'tsconfig.json'));
  fs.copyFileSync(path.join(kazzooDir, 'tailwind.config.js'), path.join(projectDir, 'tailwind.config.js'));
  fs.copyFileSync(path.join(kazzooDir, 'postcss.config.js'), path.join(projectDir, 'postcss.config.js'));

  const pkg = JSON.parse(fs.readFileSync(path.join(kazzooDir, 'package.json'), 'utf-8'));
  pkg.name = projectName;
  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2));

  // 1. Resolve & Generate 3D Observatory (IMMERSIVE_3D)
  const comp3D = CompositionVariantResolver.resolve({
    brandName: "Celestia Nocturne",
    prompt: PROMPT,
    route: "/",
    pageRole: "3D Planetary Armillary",
    purpose: "Interactive 3D Miniature Planetary System",
    seed,
    experienceCapability: "IMMERSIVE_3D"
  });

  console.log(`[${projectName}] Resolved IMMERSIVE_3D composition (seed=${seed}): ${comp3D.id} (${comp3D.structuralFingerprint})`);

  const threeDCode = GenericExperienceGenerator.generate({
    componentName: "ObservatoryArmillaryPage",
    brandName: "Celestia Nocturne",
    route: "/",
    pageRole: "3D Planetary Armillary",
    purpose: "Interactive 3D Miniature Planetary System",
    prompt: PROMPT,
    seed,
    experienceCapability: "IMMERSIVE_3D",
    composition: comp3D
  });
  fs.writeFileSync(path.join(pagesDir, 'ObservatoryArmillaryPage.tsx'), threeDCode);

  // 2. Resolve & Generate Cosmic Journey (SCROLL_STORY)
  const journeyCode = GenericExperienceGenerator.generate({
    componentName: "CosmicJourneyPage",
    brandName: "Celestia Nocturne",
    route: "/cosmic-journey",
    pageRole: "Guided Cosmic Journey",
    purpose: "Guided scientific voyage through planetary transits",
    prompt: PROMPT,
    seed,
    experienceCapability: "SCROLL_STORY"
  });
  fs.writeFileSync(path.join(pagesDir, 'CosmicJourneyPage.tsx'), journeyCode);

  // 3. Resolve & Generate Planetary Astrometry Map (SPATIAL_MAP)
  const mapCode = GenericExperienceGenerator.generate({
    componentName: "PlanetaryAstrometryMapPage",
    brandName: "Celestia Nocturne",
    route: "/astrometry-chart",
    pageRole: "Planetary Coordinate Chart",
    purpose: "Interactive orbital coordinate chart and transit waypoints",
    prompt: PROMPT,
    seed,
    experienceCapability: "SPATIAL_MAP"
  });
  fs.writeFileSync(path.join(pagesDir, 'PlanetaryAstrometryMapPage.tsx'), mapCode);

  // 4. Create App.tsx with navigation
  const appCode = `import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { ObservatoryArmillaryPage } from "./pages/ObservatoryArmillaryPage";
import { CosmicJourneyPage } from "./pages/CosmicJourneyPage";
import { PlanetaryAstrometryMapPage } from "./pages/PlanetaryAstrometryMapPage";
import { Orbit, Compass, Sparkles } from "lucide-react";

function Header() {
  const loc = useLocation();
  const navItems = [
    { to: "/", label: "3D Planetary Armillary", icon: Orbit },
    { to: "/cosmic-journey", label: "Guided Cosmic Journey", icon: Compass },
    { to: "/astrometry-chart", label: "Astrometry Chart", icon: Sparkles }
  ];

  return (
    <header style={{
      minHeight: "64px",
      background: "rgba(5, 7, 17, 0.94)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(197, 160, 89, 0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.625rem 1.25rem",
      flexWrap: "wrap",
      gap: "0.625rem",
      position: "relative",
      zIndex: 40
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ffd166, #c5a059 60%, #1e1b18)",
          boxShadow: "0 0 15px rgba(212, 175, 55, 0.4)",
          border: "1px solid rgba(255, 215, 0, 0.4)"
        }} />
        <div>
          <span style={{ fontFamily: "Cinzel, serif", fontWeight: 700, fontSize: "1.125rem", letterSpacing: "0.08em", color: "#f8fafc" }}>
            CELESTIA NOCTURNE
          </span>
          <div style={{ fontSize: "0.625rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#c5a059", fontWeight: 600 }}>
            Midnight Planetary Observatory
          </div>
        </div>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {navItems.map(item => {
          const active = loc.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.875rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: active ? 700 : 500,
                textDecoration: "none",
                color: active ? "#ffd166" : "rgba(226, 232, 240, 0.7)",
                background: active ? "rgba(197, 160, 89, 0.15)" : "transparent",
                border: "1px solid " + (active ? "rgba(197, 160, 89, 0.4)" : "transparent"),
                transition: "all 0.2s"
              }}
            >
              <item.icon style={{ width: "0.875rem", height: "0.875rem" }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "rgba(197, 160, 89, 0.08)",
        border: "1px solid rgba(197, 160, 89, 0.2)",
        padding: "0.35rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.6875rem",
        color: "#c5a059",
        fontWeight: 600
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
        <span>Aperture Calibrated</span>
      </div>
    </header>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#050711", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Header />
        <Routes>
          <Route path="/" element={<ObservatoryArmillaryPage />} />
          <Route path="/cosmic-journey" element={<CosmicJourneyPage />} />
          <Route path="/astrometry-chart" element={<PlanetaryAstrometryMapPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;
`;
  fs.writeFileSync(path.join(srcDir, 'App.tsx'), appCode);

  // 5. Create main.tsx
  const mainCode = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainCode);

  // 6. Create index.css
  fs.writeFileSync(path.join(srcDir, 'index.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background-color: #050711;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
}
`);

  // 7. Create index.html
  fs.writeFileSync(path.join(projectDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Celestia Nocturne — Midnight Planetary Observatory</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#050711] text-[#f8fafc] antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  console.log(`[${projectName}] Scaffolding complete!`);
}

setupProject("celestia-nocturne-a", 101);
setupProject("celestia-nocturne-b", 202);
console.log("Both Celestia Nocturne variations generated successfully!");
