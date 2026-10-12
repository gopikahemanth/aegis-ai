import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("PageExperienceQualityGate", () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis-page-gate-test-${Date.now()}`);
    mkdirSync(join(testProjectDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(testProjectDir)) {
        rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it("fails when secondary routes collapse into generic search/filter card grids", () => {
    const plan: any = {
      productTitle: "Kazzoo Fantasy World",
      pagePlans: [
        {
          route: "/",
          pageRole: "World Entrance & Living Spatial Universe",
          purpose: "Primary 3D interactive fantasy world entrance with WebGL archipelago stage",
          experienceIntent: "Immerse user in procedural 3D claymation world",
          focalElement: "Floating claymation island archipelago",
          composition: { topology: "IMMERSIVE_WORLD", layers: [], sections: [], dominantStructure: "FULL_BLEED_STAGE" },
          interaction: { primary: ["Orbit camera"], secondary: [] },
          motion: { entrance: "camera dolly", scroll: "orbit", transitions: [] },
          contentPresentation: "Spatial 3D canvas",
          visualHierarchy: { primary: "3D Archipelago Stage", secondary: [] },
          responsiveStrategy: "Full-viewport canvas",
          requiredCapabilities: ["3d-webgl-canvas"],
          forbiddenPatterns: ["search bar", "card grid"],
        },
        {
          route: "/characters",
          pageRole: "Interactive Character Spotlight & Lore Stage",
          purpose: "Character inspection stage with 3D rotatable avatars and voice clips",
          experienceIntent: "Inspect handcrafted 3D companions",
          focalElement: "Large 3D character inspection plinth",
          composition: { topology: "CHARACTER_STAGE", layers: [], sections: [], dominantStructure: "CHARACTER_ENCOUNTER_CAROUSEL" },
          interaction: { primary: ["Switch companion"], secondary: [] },
          motion: { entrance: "spin", scroll: "fixed", transitions: [] },
          contentPresentation: "Character spotlight",
          visualHierarchy: { primary: "3D Character Plinth", secondary: [] },
          responsiveStrategy: "Stacked character stage",
          requiredCapabilities: ["3d-avatar-stage"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
      ],
    };

    // Route / is a real 3D stage
    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React from 'react';
      export default function HomePage() {
        return (
          <div data-workspace="3d_stage">
            <canvas data-aegis-3d="true" />
            <button onClick={() => console.log('orbit')}>Orbit</button>
          </div>
        );
      }`
    );

    // Route /characters collapsed into search + filter + cards
    writeFileSync(
      join(testProjectDir, "src", "pages", "CharactersPage.tsx"),
      `import React, { useState } from 'react';
      export default function CharactersPage() {
        const [searchTerm, setSearchTerm] = useState('');
        return (
          <div>
            <h1>Characters</h1>
            <input type="text" placeholder="Search characters..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="filter-buttons"><button>All</button></div>
            <div className="grid-cols-3">
              <div className="card">Muffy</div>
              <div className="card">Rony</div>
              <div className="card">Pip</div>
              <div className="card">Grizzle</div>
            </div>
          </div>
        );
      }`
    );

    const report = PageExperienceQualityGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(false);
    expect(report.routesPassed).toBe(1);
    expect(report.routesEvaluated).toBe(2);

    const charResult = report.routeResults.find(r => r.route === "/characters");
    expect(charResult).toBeDefined();
    expect(charResult?.status).toBe("FAIL");
    expect(charResult?.violations.some(v => v.includes("FORBIDDEN_PATTERN"))).toBe(true);
  });

  it("passes when every route implements its bespoke, intentional experience plan", () => {
    const plan: any = {
      productTitle: "Kazzoo Fantasy World",
      pagePlans: [
        {
          route: "/",
          pageRole: "World Entrance & Living Spatial Universe",
          purpose: "Primary 3D interactive fantasy world entrance with WebGL archipelago stage",
          experienceIntent: "Immerse user in procedural 3D claymation world",
          focalElement: "Floating claymation island archipelago",
          composition: { topology: "IMMERSIVE_WORLD", layers: [], sections: [], dominantStructure: "FULL_BLEED_STAGE" },
          interaction: { primary: ["Orbit camera"], secondary: [] },
          motion: { entrance: "camera dolly", scroll: "orbit", transitions: [] },
          contentPresentation: "Spatial 3D canvas",
          visualHierarchy: { primary: "3D Archipelago Stage", secondary: [] },
          responsiveStrategy: "Full-viewport canvas",
          requiredCapabilities: ["3d-webgl-canvas"],
          forbiddenPatterns: ["search bar", "card grid"],
        },
        {
          route: "/characters",
          pageRole: "Interactive Character Spotlight & Lore Stage",
          purpose: "Character inspection stage with 3D rotatable avatars and voice clips",
          experienceIntent: "Inspect handcrafted 3D companions",
          focalElement: "Large 3D character inspection plinth",
          composition: { topology: "CHARACTER_STAGE", layers: [], sections: [], dominantStructure: "CHARACTER_ENCOUNTER_CAROUSEL" },
          interaction: { primary: ["Switch companion"], secondary: [] },
          motion: { entrance: "spin", scroll: "fixed", transitions: [] },
          contentPresentation: "Character spotlight",
          visualHierarchy: { primary: "3D Character Plinth", secondary: [] },
          responsiveStrategy: "Stacked character stage",
          requiredCapabilities: ["3d-avatar-stage"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
        {
          route: "/soundboard",
          pageRole: "Atmospheric Sound Studio & Tactile Audio Environment",
          purpose: "Playful audio mixing environment with large interactive sound objects",
          experienceIntent: "Mix realm ambient audio",
          focalElement: "Tactile sound studio console",
          composition: { topology: "AUDIO_CONSOLE", layers: [], sections: [], dominantStructure: "TACTILE_AUDIO_SURFACE" },
          interaction: { primary: ["Tap sound pads"], secondary: [] },
          motion: { entrance: "soundwave ripple", scroll: "fixed", transitions: [] },
          contentPresentation: "Tactile synthesizer console",
          visualHierarchy: { primary: "Audio Waveform Visualizer", secondary: [] },
          responsiveStrategy: "Touch-optimized grid",
          requiredCapabilities: ["web-audio-synth"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
      ],
    };

    // Route / (World stage)
    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React from 'react';
      export default function HomePage() {
        return (
          <div data-workspace="3d_world_stage">
            <canvas data-aegis-3d="true" />
            <button onClick={() => console.log('orbit')}>Explore Biomes</button>
          </div>
        );
      }`
    );

    // Route /characters (Character 3D spotlight)
    writeFileSync(
      join(testProjectDir, "src", "pages", "CharactersPage.tsx"),
      `import React, { useState } from 'react';
      export default function CharactersPage() {
        const [activeAvatar, setActiveAvatar] = useState('Muffy');
        return (
          <div data-workspace="character_stage">
            <canvas data-avatar-3d="true" />
            <div className="companion-dock">
              <button onClick={() => setActiveAvatar('Muffy')}>Muffy</button>
              <button onClick={() => setActiveAvatar('Rony')}>Rony</button>
            </div>
            <p className="lore-quote">Active Companion: {activeAvatar}</p>
          </div>
        );
      }`
    );

    // Route /soundboard (Audio synthesizer)
    writeFileSync(
      join(testProjectDir, "src", "pages", "SoundboardPage.tsx"),
      `import React, { useState } from 'react';
      export default function SoundboardPage() {
        const [volume, setVolume] = useState(0.8);
        const playTone = (freq: number) => {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.frequency.value = freq;
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        };
        return (
          <div data-workspace="sound_studio">
            <h2>Atmospheric Soundboard</h2>
            <button onClick={() => playTone(440)}>Forest Chime</button>
            <button onClick={() => playTone(330)}>Breeze Resonance</button>
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(Number(e.target.value))} />
          </div>
        );
      }`
    );

    const report = PageExperienceQualityGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(true);
    expect(report.routesPassed).toBe(3);
    expect(report.routesEvaluated).toBe(3);
  });

  it("regression: fails entire frontend review when only homepage is rich while secondary routes are generic cards/forms", () => {
    const plan: any = {
      productTitle: "Kazzoo Fantasy Realm",
      pagePlans: [
        {
          route: "/",
          pageRole: "World Entrance & Living Spatial Universe",
          purpose: "Primary 3D interactive fantasy world entrance with WebGL archipelago stage",
          experienceIntent: "Immerse user in procedural 3D claymation world",
          focalElement: "Floating claymation island archipelago",
          composition: { topology: "IMMERSIVE_WORLD", layers: [], sections: [], dominantStructure: "FULL_BLEED_STAGE" },
          interaction: { primary: ["Orbit camera"], secondary: [] },
          motion: { entrance: "camera dolly", scroll: "orbit", transitions: [] },
          contentPresentation: "Spatial 3D canvas",
          visualHierarchy: { primary: "3D Archipelago Stage", secondary: [] },
          responsiveStrategy: "Full-viewport canvas",
          requiredCapabilities: ["3d-webgl-canvas"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
        {
          route: "/characters",
          pageRole: "Interactive Character Spotlight & Lore Stage",
          purpose: "Character inspection stage with 3D rotatable avatars and voice clips",
          experienceIntent: "Inspect handcrafted 3D companions",
          focalElement: "Large 3D character inspection plinth",
          composition: { topology: "CHARACTER_STAGE", layers: [], sections: [], dominantStructure: "CHARACTER_ENCOUNTER_CAROUSEL" },
          interaction: { primary: ["Switch companion"], secondary: [] },
          motion: { entrance: "spin", scroll: "fixed", transitions: [] },
          contentPresentation: "Character spotlight",
          visualHierarchy: { primary: "3D Character Plinth", secondary: [] },
          responsiveStrategy: "Stacked character stage",
          requiredCapabilities: ["3d-avatar-stage"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
        {
          route: "/quest-map",
          pageRole: "Spatial Quest Trail Map & Route Plotter",
          purpose: "Interactive spatial map with paths and landmarks",
          experienceIntent: "Navigate island landmarks",
          focalElement: "Spatial island trail map canvas",
          composition: { topology: "SPATIAL_MAP", layers: [], sections: [], dominantStructure: "INTERACTIVE_MAP_CANVAS" },
          interaction: { primary: ["Select landmark waypoint"], secondary: [] },
          motion: { entrance: "map unroll", scroll: "pan", transitions: [] },
          contentPresentation: "Cartographic surface",
          visualHierarchy: { primary: "Trail map canvas", secondary: [] },
          responsiveStrategy: "Pannable map",
          requiredCapabilities: ["spatial-map-canvas"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
        {
          route: "/soundboard",
          pageRole: "Atmospheric Sound Studio & Tactile Audio Environment",
          purpose: "Playful audio environment with interactive sound pads",
          experienceIntent: "Mix realm ambient audio",
          focalElement: "Tactile sound studio console",
          composition: { topology: "AUDIO_CONSOLE", layers: [], sections: [], dominantStructure: "TACTILE_AUDIO_SURFACE" },
          interaction: { primary: ["Tap sound pads"], secondary: [] },
          motion: { entrance: "soundwave ripple", scroll: "fixed", transitions: [] },
          contentPresentation: "Tactile synthesizer console",
          visualHierarchy: { primary: "Audio Waveform Visualizer", secondary: [] },
          responsiveStrategy: "Touch-optimized grid",
          requiredCapabilities: ["web-audio-synth"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
        {
          route: "/journey",
          pageRole: "Scroll-Driven Journey Chronicle",
          purpose: "Continuous narrative scroll experience with scene transitions",
          experienceIntent: "Read generative chronicle",
          focalElement: "Illuminated narrative parchment scroll",
          composition: { topology: "NARRATIVE_SCROLL", layers: [], sections: [], dominantStructure: "ILLUMINATED_SCROLL_TIMELINE" },
          interaction: { primary: ["Scroll-linked scene progression"], secondary: [] },
          motion: { entrance: "parchment unroll", scroll: "scroll-linked", transitions: [] },
          contentPresentation: "Editorial parchment",
          visualHierarchy: { primary: "Narrative chapter", secondary: [] },
          responsiveStrategy: "Fluid prose column",
          requiredCapabilities: ["scroll-chapter-controller"],
          forbiddenPatterns: ["search bar", "card grid", "crud forms"],
        },
      ],
    };

    // Page 1: Beautiful custom 3D entrance
    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React from 'react';
      export default function HomePage() {
        return (
          <div data-workspace="3d_world_stage">
            <canvas data-aegis-3d="true" />
            <button onClick={() => console.log('orbit')}>Explore Biomes</button>
          </div>
        );
      }`
    );

    // Page 2: Generic cards
    writeFileSync(
      join(testProjectDir, "src", "pages", "CharactersPage.tsx"),
      `import React, { useState } from 'react';
      export default function CharactersPage() {
        const [searchQuery, setSearchQuery] = useState('');
        return (
          <div>
            <h1>Characters</h1>
            <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="grid-cols-3">
              <div className="card">Muffy</div>
              <div className="card">Rony</div>
              <div className="card">Pip</div>
              <div className="card">Grizzle</div>
            </div>
          </div>
        );
      }`
    );

    // Page 3: Generic cards
    writeFileSync(
      join(testProjectDir, "src", "pages", "QuestMapPage.tsx"),
      `import React, { useState } from 'react';
      export default function QuestMapPage() {
        const [statusFilter, setStatusFilter] = useState('all');
        return (
          <div>
            <h1>Quests</h1>
            <div className="filter-buttons"><button onClick={() => setStatusFilter('all')}>All</button></div>
            <div className="grid-cols-3">
              <div className="card">Quest 1</div>
              <div className="card">Quest 2</div>
              <div className="card">Quest 3</div>
              <div className="card">Quest 4</div>
            </div>
          </div>
        );
      }`
    );

    // Page 4: Generic list / CRUD form
    writeFileSync(
      join(testProjectDir, "src", "pages", "SoundboardPage.tsx"),
      `import React, { useState } from 'react';
      export default function SoundboardPage() {
        const [newName, setNewName] = useState('');
        return (
          <div>
            <h1>Soundboard</h1>
            <form onSubmit={e => e.preventDefault()}>
              <input value={newName} onChange={e => setNewName(e.target.value)} />
              <button type="submit">Add Track</button>
            </form>
          </div>
        );
      }`
    );

    // Page 5: Generic application layout / card grid
    writeFileSync(
      join(testProjectDir, "src", "pages", "JourneyPage.tsx"),
      `import React, { useState } from 'react';
      export default function JourneyPage() {
        const [searchQuery, setSearchQuery] = useState('');
        return (
          <div>
            <h1>Journey</h1>
            <input placeholder="Search chronicle..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="grid-cols-2">
              <div className="card">Chapter 1</div>
              <div className="card">Chapter 2</div>
              <div className="card">Chapter 3</div>
              <div className="card">Chapter 4</div>
            </div>
          </div>
        );
      }`
    );

    const report = PageExperienceQualityGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(false);
    expect(report.routesPassed).toBe(1); // Only Home passed
    expect(report.routesEvaluated).toBe(5);

    // Verify all 4 secondary pages failed
    const failedRoutes = report.routeResults.filter(r => r.status === "FAIL");
    expect(failedRoutes.length).toBe(4);
    expect(failedRoutes.map(r => r.route)).toEqual(["/characters", "/quest-map", "/soundboard", "/journey"]);
  });
});
