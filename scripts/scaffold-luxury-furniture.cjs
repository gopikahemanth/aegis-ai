const fs = require('fs');
const path = require('path');
const { GenericExperienceGenerator } = require('../packages/ai-core/dist/design/experience-generators/generic-experience-generator.js');

const PROJECT_DIR = path.resolve(__dirname, '../projects/luxury-furniture');
const SRC_DIR = path.join(PROJECT_DIR, 'src');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}

const prompt = "Build a luxury handcrafted wood furniture studio and configurator called Atelier Oakhaven with 3D timber turntable, mortise-and-tenon joinery chronicle, and artisan ergonomics workbench.";

console.log("Generating Atelier Oakhaven experiences via GenericExperienceGenerator...");

// 1. 3D Timber Turntable
const turntableCode = GenericExperienceGenerator.generate({
  componentName: "TimberTurntable",
  brandName: "Atelier Oakhaven",
  route: "/",
  pageRole: "3D Timber Turntable",
  purpose: "Interactive 3D handcrafted wood furniture turntable",
  prompt,
  seed: 42,
  experienceCapability: "IMMERSIVE_3D"
});
fs.writeFileSync(path.join(PAGES_DIR, 'TimberTurntable.tsx'), turntableCode);
console.log("Generated TimberTurntable.tsx");

// 2. Joinery Chronicle
const chronicleCode = GenericExperienceGenerator.generate({
  componentName: "JoineryChronicle",
  brandName: "Atelier Oakhaven",
  route: "/joinery-chronicle",
  pageRole: "Joinery Craft Chronicle",
  purpose: "Scroll essay on timber joinery and heirloom woodworking",
  prompt,
  seed: 42,
  experienceCapability: "SCROLL_STORY"
});
fs.writeFileSync(path.join(PAGES_DIR, 'JoineryChronicle.tsx'), chronicleCode);
console.log("Generated JoineryChronicle.tsx");

// 3. Ergonomics Workbench
const workbenchCode = GenericExperienceGenerator.generate({
  componentName: "ErgonomicsWorkbench",
  brandName: "Atelier Oakhaven",
  route: "/ergonomics-workbench",
  pageRole: "Artisan Joinery Configurator",
  purpose: "Woodcraft & Ergonomics Workbench",
  prompt,
  seed: 42,
  experienceCapability: "WORKSPACE_TOOL"
});
fs.writeFileSync(path.join(PAGES_DIR, 'ErgonomicsWorkbench.tsx'), workbenchCode);
console.log("Generated ErgonomicsWorkbench.tsx");

// 4. Timber Provenance Map
const provenanceCode = GenericExperienceGenerator.generate({
  componentName: "TimberProvenanceMap",
  brandName: "Atelier Oakhaven",
  route: "/timber-provenance",
  pageRole: "Timber Provenance Map",
  purpose: "Sustainable forest coordinates and aged oak reserves",
  prompt,
  seed: 42,
  experienceCapability: "SPATIAL_MAP"
});
fs.writeFileSync(path.join(PAGES_DIR, 'TimberProvenanceMap.tsx'), provenanceCode);
console.log("Generated TimberProvenanceMap.tsx");

// Copy package.json, vite.config.ts, tsconfig.json from kazzoo-a
const kazzooDir = path.resolve(__dirname, '../projects/kazzoo-a');
fs.copyFileSync(path.join(kazzooDir, 'vite.config.ts'), path.join(PROJECT_DIR, 'vite.config.ts'));
fs.copyFileSync(path.join(kazzooDir, 'tsconfig.json'), path.join(PROJECT_DIR, 'tsconfig.json'));
fs.copyFileSync(path.join(kazzooDir, 'tailwind.config.js'), path.join(PROJECT_DIR, 'tailwind.config.js'));
fs.copyFileSync(path.join(kazzooDir, 'postcss.config.js'), path.join(PROJECT_DIR, 'postcss.config.js'));

const pkg = JSON.parse(fs.readFileSync(path.join(kazzooDir, 'package.json'), 'utf-8'));
pkg.name = 'atelier-oakhaven-furniture';
fs.writeFileSync(path.join(PROJECT_DIR, 'package.json'), JSON.stringify(pkg, null, 2));

// Create index.html
fs.writeFileSync(path.join(PROJECT_DIR, 'index.html'), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Atelier Oakhaven — Handcrafted Timber & Ergonomics</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#181512] text-[#e8dfd8] antialiased selection:bg-[#c99a68] selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

// Create index.css
fs.writeFileSync(path.join(SRC_DIR, 'index.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-serif: 'Cinzel', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: #161310;
  color: #ede5dd;
}
`);

// Create Navbar
fs.writeFileSync(path.join(SRC_DIR, 'Navbar.tsx'), `import React from 'react';
import { NavLink } from 'react-router-dom';

export function Navbar() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#d9a066] border-b-2 border-[#d9a066] uppercase"
      : "px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#a89f91] hover:text-[#e8dfd8] uppercase transition-colors";

  return (
    <header className="sticky top-0 z-50 bg-[#161310]/95 backdrop-blur border-b border-[#2e261f] px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#d9a066] shadow-[0_0_8px_#d9a066]"></span>
        <div>
          <h1 className="text-base font-bold tracking-widest text-[#f5eee6] font-serif uppercase">Atelier Oakhaven</h1>
          <p className="text-[10px] tracking-widest text-[#a89f91] uppercase">Artisan Timber & Ergonomics</p>
        </div>
      </div>
      <nav className="flex items-center gap-4">
        <NavLink to="/" className={linkClasses}>3D Turntable</NavLink>
        <NavLink to="/joinery-chronicle" className={linkClasses}>Joinery Chronicle</NavLink>
        <NavLink to="/ergonomics-workbench" className={linkClasses}>Ergonomics Workbench</NavLink>
        <NavLink to="/timber-provenance" className={linkClasses}>Timber Provenance</NavLink>
      </nav>
      <div className="flex items-center gap-3 text-xs text-[#d9a066] border border-[#d9a066]/30 px-3 py-1.5 rounded-full font-mono">
        <span>Aged Oak Standard</span>
      </div>
    </header>
  );
}
`);

// Create routes.tsx
fs.writeFileSync(path.join(SRC_DIR, 'routes.tsx'), `import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TimberTurntable } from './pages/TimberTurntable';
import { JoineryChronicle } from './pages/JoineryChronicle';
import { ErgonomicsWorkbench } from './pages/ErgonomicsWorkbench';
import { TimberProvenanceMap } from './pages/TimberProvenanceMap';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TimberTurntable />} />
      <Route path="/joinery-chronicle" element={<JoineryChronicle />} />
      <Route path="/ergonomics-workbench" element={<ErgonomicsWorkbench />} />
      <Route path="/timber-provenance" element={<TimberProvenanceMap />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
`);

// Create App.tsx
fs.writeFileSync(path.join(SRC_DIR, 'App.tsx'), `import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import AppRoutes from './routes';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#161310] text-[#ede5dd]">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
`);

// Create main.tsx
fs.writeFileSync(path.join(SRC_DIR, 'main.tsx'), `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

console.log("Atelier Oakhaven scaffolding complete!");
