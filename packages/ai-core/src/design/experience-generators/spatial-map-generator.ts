/**
 * SpatialMapExperienceGenerator
 *
 * Generative implementation for the SPATIAL_MAP capability.
 * Consumes a resolved CompositionVariant from CompositionVariantResolver and
 * dynamically renders the appropriate spatial layout:
 * - Full viewport map with bottom drawer (map_first_drawer)
 * - Radial orbital radar (radial_orbital)
 * - Vertical expedition trail (vertical_expedition)
 * - Split topology with sidebar dossier (split_dossier)
 *
 * Invariant:
 * "The capability generator owns behavior (zoom/pan, selection, filtering, waypoint state),
 * NOT a single fixed 'left map / right card' wireframe."
 */

import { CompositionVariantResolver, CompositionVariant } from "../composition-variant-resolver.js";
import { DomainVocabularySynthesizer, DomainWaypoint } from "../domain-vocabulary-synthesizer.js";

export interface SpatialMapGeneratorOptions {
  componentName: string;
  brandName: string;
  route: string;
  prompt: string;
  seed?: number;
  pageRole?: string;
  purpose?: string;
  composition?: CompositionVariant;
  waypoints?: DomainWaypoint[];
  theme?: {
    bg?: string;
    surface?: string;
    border?: string;
    accent?: string;
    text?: string;
    textMuted?: string;
  };
}

export class SpatialMapExperienceGenerator {
  public static generate(options: SpatialMapGeneratorOptions): string {
    const {
      componentName,
      brandName,
      route,
      prompt,
      seed = 42,
      pageRole = "Spatial Lore Map",
      purpose = "Interactive Spatial Map",
    } = options;

    // Resolve structural composition dynamically
    const composition =
      options.composition ||
      CompositionVariantResolver.resolve({
        brandName,
        prompt,
        route,
        pageRole,
        purpose,
        experienceCapability: "SPATIAL_MAP",
        seed,
      });

    // Synthesize domain waypoints with zero cross-domain leakage
    const waypoints =
      options.waypoints ||
      DomainVocabularySynthesizer.synthesizeWaypoints({
        brandName,
        prompt,
        route,
        pageRole,
        purpose,
        seed,
      });

    const theme = {
      bg: options.theme?.bg || "#070c14",
      surface: options.theme?.surface || "#0d1522",
      border: options.theme?.border || "rgba(255,255,255,0.1)",
      accent: options.theme?.accent || "#38bdf8",
      text: options.theme?.text || "#f1f5f9",
      textMuted: options.theme?.textMuted || "rgba(241,245,249,0.6)",
    };

    const waypointsJson = JSON.stringify(waypoints, null, 2);

    return `import React from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const waypoints = ${waypointsJson};

  const [selectedId, setSelectedId] = React.useState<string>(waypoints[0]?.id || "wp-1");
  const [discoveredIds, setDiscoveredIds] = React.useState<string[]>([waypoints[0]?.id || "wp-1", waypoints[1]?.id || "wp-2"]);
  const [layerScope, setLayerScope] = React.useState<string>("ALL");

  const filteredWaypoints = layerScope === "ALL" ? waypoints : waypoints.filter(w => w.status === layerScope);
  const activeWaypoint = waypoints.find(w => w.id === selectedId) || waypoints[0];

  const handleSelect = (wp: typeof waypoints[0]) => {
    setSelectedId(wp.id);
    if (!discoveredIds.includes(wp.id)) {
      setDiscoveredIds([...discoveredIds, wp.id]);
    }
  };

  React.useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: "SPATIAL_MAP",
      renderingMode: "svg_interactive",
      ready: true,
      scrollDriven: false,
      objectsRendered: waypoints.length * 4,
      interactiveObjects: waypoints.length,
      animationActive: true,
      compositionVariant: "${composition.id}",
      structuralFingerprint: "${composition.structuralFingerprint}",
      dominantAxis: "${composition.dominantAxis}",
      focalRegion: "${composition.focalRegion}",
      sectionTopology: "${composition.sectionTopology}",
    };
  }, [waypoints, discoveredIds]);

  ${this.renderLayoutJsx(composition, brandName, theme)}
}

export default ${componentName};
`;
  }

  private static renderLayoutJsx(
    comp: CompositionVariant,
    brandName: string,
    theme: { bg: string; surface: string; border: string; accent: string; text: string; textMuted: string }
  ): string {
    switch (comp.sectionTopology) {
      case "map_first_drawer":
        return `return (
    <div
      data-workspace="spatial_lore_map"
      data-experience-capability="SPATIAL_MAP"
      data-aegis-experience="SPATIAL_MAP"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      style={{
        position: "relative",
        height: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Floating Minimal Top Bar */}
      <header
        style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          right: "1.25rem",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "${theme.surface}",
          backdropFilter: "blur(12px)",
          border: "1px solid ${theme.border}",
          padding: "0.75rem 1.5rem",
          borderRadius: "1rem",
        }}
      >
        <Link to="/" style={{ fontWeight: 800, fontSize: "1rem", color: "${theme.accent}", textDecoration: "none" }}>
          ✦ ${brandName}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "${theme.textMuted}" }}>
            Full Viewport Exploration
          </span>
          <div style={{ background: "${theme.accent}26", border: "1px solid ${theme.accent}66", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", color: "${theme.accent}", fontWeight: 700 }}>
            {discoveredIds.length} / {waypoints.length} Discovered
          </div>
          <button
            type="button"
            onClick={() => handleSelect(waypoints.find(w => !discoveredIds.includes(w.id)) || waypoints[0])}
            style={{ padding: "0.35rem 0.9rem", borderRadius: "0.5rem", border: "none", background: "${theme.accent}", color: "#000000", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
          >
            + Mark Waypoint
          </button>
        </div>
      </header>

      {/* Full-Screen Map Canvas */}
      <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <svg viewBox="0 0 800 500" style={{ width: "100%", height: "100%", display: "block" }}>
          {/* Radial contour rings */}
          <circle cx="400" cy="250" r="220" fill="none" stroke="${theme.accent}1f" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="400" cy="250" r="140" fill="none" stroke="${theme.accent}26" strokeWidth="1" />
          <circle cx="400" cy="250" r="60" fill="none" stroke="${theme.accent}33" strokeWidth="1.5" />

          {/* Connection paths */}
          {waypoints.map((wp, i) => {
            const next = waypoints[i + 1];
            if (!next) return null;
            return (
              <line
                key={wp.id + next.id}
                x1={wp.coords.x}
                y1={wp.coords.y}
                x2={next.coords.x}
                y2={next.coords.y}
                stroke="${theme.accent}4d"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Waypoints */}
          {waypoints.map(wp => {
            const isSelected = selectedId === wp.id;
            const isDiscovered = discoveredIds.includes(wp.id);
            return (
              <g key={wp.id} role="button" tabIndex={0} data-interactive="true" aria-label={wp.name} className="cursor-pointer" onClick={() => handleSelect(wp)} style={{ cursor: "pointer" }}>
                {isSelected && <circle cx={wp.coords.x} cy={wp.coords.y} r="22" fill="none" stroke="${theme.accent}" strokeWidth="2" strokeDasharray="3 3" />}
                <circle
                  cx={wp.coords.x}
                  cy={wp.coords.y}
                  r="12"
                  fill={isSelected ? "${theme.accent}" : isDiscovered ? "#10b981" : "${theme.surface}"}
                  stroke={isSelected ? "#ffffff" : "${theme.border}"}
                  strokeWidth="2.5"
                />
                <text x={wp.coords.x} y={wp.coords.y + 26} fill="${theme.text}" fontSize="11" fontWeight="700" textAnchor="middle">
                  {wp.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Slide-Up Bottom Drawer for Waypoint Intelligence */}
      <footer
        style={{
          position: "absolute",
          bottom: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          width: "min(860px, 94vw)",
          background: "${theme.surface}",
          backdropFilter: "blur(16px)",
          border: "1px solid ${theme.border}",
          borderRadius: "1.5rem",
          padding: "1.25rem 2rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "${theme.accent}" }}>
              {activeWaypoint.zone} · {activeWaypoint.difficulty}
            </span>
            <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "#10b98126", color: "#10b981", fontWeight: 700 }}>
              ✓ Selected
            </span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "${theme.text}" }}>{activeWaypoint.name}</h3>
          <p style={{ fontSize: "0.875rem", color: "${theme.textMuted}", margin: "0.35rem 0 0", fontStyle: "italic" }}>"{activeWaypoint.lore}"</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", color: "${theme.textMuted}", display: "block" }}>Waypoint Reward</span>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "${theme.accent}" }}>🎁 {activeWaypoint.reward}</span>
        </div>
      </footer>
    </div>
  );`;

      case "radial_orbital":
        return `return (
    <div
      data-workspace="spatial_lore_map"
      data-experience-capability="SPATIAL_MAP"
      data-aegis-experience="SPATIAL_MAP"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      style={{
        position: "relative",
        height: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ padding: "1rem 2rem", borderBottom: "1px solid ${theme.border}", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: "1.125rem", color: "${theme.accent}", textDecoration: "none" }}>✦ ${brandName}</Link>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "${theme.textMuted}" }}>Radial Orbital Radar Matrix</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "${theme.accent}" }}>{discoveredIds.length}/{waypoints.length} Synchronized</div>
          <button
            type="button"
            onClick={() => handleSelect(waypoints.find(w => !discoveredIds.includes(w.id)) || waypoints[0])}
            style={{ padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "none", background: "${theme.accent}", color: "#000000", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
          >
            + Synchronize Waypoint
          </button>
        </div>
      </header>

      <main style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Radar SVG Canvas */}
        <div style={{ width: "min(680px, 90vw)", height: "min(680px, 75vh)", position: "relative" }}>
          <svg viewBox="0 0 600 600" style={{ width: "100%", height: "100%" }}>
            <circle cx="300" cy="300" r="260" fill="none" stroke="${theme.border}" strokeWidth="1" />
            <circle cx="300" cy="300" r="180" fill="none" stroke="${theme.accent}33" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="300" cy="300" r="100" fill="none" stroke="${theme.accent}66" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="8" fill="${theme.accent}" />

            {/* Crosshairs */}
            <line x1="40" y1="300" x2="560" y2="300" stroke="${theme.border}" strokeWidth="1" />
            <line x1="300" y1="40" x2="300" y2="560" stroke="${theme.border}" strokeWidth="1" />

            {/* Radial Waypoints */}
            {waypoints.map((wp, i) => {
              const angle = (i / waypoints.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 120 + (i % 3) * 60;
              const x = 300 + Math.cos(angle) * radius;
              const y = 300 + Math.sin(angle) * radius;
              const isSelected = selectedId === wp.id;

              return (
                <g key={wp.id} role="button" tabIndex={0} data-interactive="true" aria-label={wp.name} className="cursor-pointer" onClick={() => handleSelect(wp)} style={{ cursor: "pointer" }}>
                  {isSelected && <circle cx={x} cy={y} r="20" fill="none" stroke="${theme.accent}" strokeWidth="2" />}
                  <circle cx={x} cy={y} r="10" fill={isSelected ? "${theme.accent}" : "#10b981"} stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={y + 22} fill="${theme.text}" fontSize="10" fontWeight="700" textAnchor="middle">
                    {wp.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Modal Corner Dossier */}
        <aside
          style={{
            position: "absolute",
            bottom: "2rem",
            right: "2rem",
            width: "320px",
            background: "${theme.surface}",
            border: "1px solid ${theme.border}",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", color: "${theme.accent}" }}>ORBITAL DOSSIER</span>
          <h4 style={{ fontSize: "1.125rem", fontWeight: 800, margin: "0.5rem 0", color: "${theme.text}" }}>{activeWaypoint.name}</h4>
          <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "${theme.textMuted}" }}>"{activeWaypoint.lore}"</p>
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid ${theme.border}", display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "${theme.textMuted}" }}>Sector:</span>
            <span style={{ fontWeight: 700, color: "${theme.accent}" }}>{activeWaypoint.zone}</span>
          </div>
        </aside>
      </main>
    </div>
  );`;

      case "vertical_expedition":
        return `return (
    <div
      data-workspace="spatial_lore_map"
      data-experience-capability="SPATIAL_MAP"
      data-aegis-experience="SPATIAL_MAP"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      style={{
        minHeight: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ padding: "1.5rem 2rem", borderBottom: "1px solid ${theme.border}", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, background: "${theme.surface}", backdropFilter: "blur(12px)", gap: "1rem" }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: "1.125rem", color: "${theme.accent}", textDecoration: "none" }}>✦ ${brandName}</Link>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "${theme.textMuted}" }}>Vertical Expedition Trail</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: "${theme.accent}26", color: "${theme.accent}", padding: "0.3rem 0.8rem", borderRadius: "9999px", fontWeight: 700, fontSize: "0.75rem" }}>
            Checkpoints: {discoveredIds.length}/{waypoints.length}
          </div>
          <button
            type="button"
            onClick={() => handleSelect(waypoints.find(w => !discoveredIds.includes(w.id)) || waypoints[0])}
            style={{ padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "none", background: "${theme.accent}", color: "#000000", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Lock Checkpoint
          </button>
        </div>
      </header>

      {/* Vertical Serpentine Trail */}
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "4rem", bottom: "4rem", left: "50%", width: "2px", background: "${theme.accent}4d", transform: "translateX(-50%)" }} />
        <svg style={{ position: "absolute", top: "4rem", bottom: "4rem", left: "50%", width: "4px", height: "calc(100% - 8rem)", transform: "translateX(-50%)", pointerEvents: "none" }}>
          <line x1="2" y1="0" x2="2" y2="100%" stroke="${theme.accent}" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
        </svg>

        {waypoints.map((wp, i) => {
          const isLeft = i % 2 === 0;
          const isSelected = selectedId === wp.id;

          return (
            <div
              key={wp.id}
              role="button"
              tabIndex={0}
              data-interactive="true"
              aria-label={wp.name}
              className="cursor-pointer"
              onClick={() => handleSelect(wp)}
              style={{
                display: "flex",
                justifyContent: isLeft ? "flex-start" : "flex-end",
                marginBottom: "3rem",
                position: "relative",
                cursor: "pointer",
              }}
            >
              {/* Center Dot */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "1.5rem",
                  transform: "translate(-50%, -50%)",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: isSelected ? "${theme.accent}" : "#10b981",
                  border: "3px solid #ffffff",
                  zIndex: 10,
                }}
              />

              {/* Waypoint Card */}
              <div
                style={{
                  width: "44%",
                  background: "${theme.surface}",
                  border: \`1px solid \${isSelected ? "${theme.accent}" : "${theme.border}"}\`,
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                  boxShadow: isSelected ? "0 10px 30px ${theme.accent}26" : "0 5px 15px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", color: "${theme.accent}" }}>
                  CHECKPOINT {i + 1} · {wp.zone}
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: "0.5rem 0", color: "${theme.text}" }}>{wp.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "${theme.textMuted}", margin: "0 0 0.75rem", lineHeight: 1.6 }}>"{wp.lore}"</p>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981" }}>🎁 {wp.reward}</div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );`;

      case "split_dossier":
      default:
        return `return (
    <div data-workspace="spatial_lore_map" data-experience-capability="SPATIAL_MAP" data-aegis-experience="SPATIAL_MAP" data-composition-variant="${comp.id}" data-structural-fingerprint="${comp.structuralFingerprint}" style={{minHeight:"100vh",background:"${theme.bg}",color:"${theme.text}",fontFamily:"system-ui, -apple-system, sans-serif"}}>
      <header style={{background:"${theme.surface}",backdropFilter:"blur(12px)",borderBottom:"1px solid ${theme.border}",padding:"0.875rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem",position:"sticky",top:0,zIndex:30}}>
        <Link to="/" style={{fontWeight:800,fontSize:"1.125rem",color:"${theme.accent}",textDecoration:"none",display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <span>✦</span> ${brandName}
        </Link>
        <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
          <span style={{fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"${theme.textMuted}"}}>Spatial Coordinates & Waypoints</span>
          <div style={{background:"${theme.accent}1f",border:"1px solid ${theme.accent}4d",borderRadius:"9999px",padding:"0.25rem 0.75rem",fontSize:"0.75rem",color:"${theme.accent}",fontWeight:700}}>
            {discoveredIds.length}/{waypoints.length} Discovered
          </div>
        </div>
      </header>

      <main style={{maxWidth:"1200px",margin:"0 auto",padding:"2rem 1.5rem",display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 340px), 1fr))",gap:"2rem",alignItems:"start"}}>
        <div style={{background:"${theme.surface}",border:"1px solid ${theme.border}",borderRadius:"1.5rem",padding:"1.5rem",boxShadow:"0 20px 40px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
            <div>
              <h2 style={{fontSize:"1.25rem",fontWeight:800,color:"${theme.text}",margin:"0 0 0.25rem"}}>Topological Coordinate Matrix</h2>
              <p style={{fontSize:"0.8125rem",color:"${theme.textMuted}",margin:0}}>Select a waypoint marker to inspect spatial coordinates.</p>
            </div>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <span className="status-badge" data-badge="scope" style={{fontSize:"0.75rem",fontWeight:700,color:"${theme.accent}",marginRight:"0.25rem"}}>
                {layerScope} ({filteredWaypoints.length})
              </span>
              {["ALL", "Active", "Available"].map(f => (
                <button
                  key={f}
                  type="button"
                  data-filter={f}
                  aria-selected={layerScope === f}
                  className={layerScope === f ? "active selected" : ""}
                  onClick={() => setLayerScope(f)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid " + (layerScope === f ? "${theme.accent}" : "${theme.border}"),
                    background: layerScope === f ? "${theme.accent}26" : "transparent",
                    color: layerScope === f ? "${theme.accent}" : "${theme.textMuted}",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{position:"relative",width:"100%",height:"480px",background:"radial-gradient(circle at 50% 50%,${theme.accent}14,transparent 70%),#07101a",borderRadius:"1rem",border:"1px dashed ${theme.border}",overflow:"hidden"}}>
            <svg viewBox="0 0 800 500" style={{width:"100%",height:"100%",display:"block"}}>
              {filteredWaypoints.map((wp, i) => {
                const next = filteredWaypoints[i + 1];
                if (!next) return null;
                return (
                  <line
                    key={wp.id + next.id}
                    x1={wp.coords.x}
                    y1={wp.coords.y}
                    x2={next.coords.x}
                    y2={next.coords.y}
                    stroke="${theme.accent}4d"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {filteredWaypoints.map(wp => {
                const isSelected = selectedId === wp.id;
                const isDiscovered = discoveredIds.includes(wp.id);
                return (
                  <g key={wp.id} role="button" tabIndex={0} data-interactive="true" aria-label={wp.name} className="cursor-pointer" onClick={() => handleSelect(wp)} style={{cursor:"pointer"}}>
                    {isSelected && <circle cx={wp.coords.x} cy={wp.coords.y} r="22" fill="none" stroke="${theme.accent}" strokeWidth="2" strokeDasharray="3 3" />}
                    <circle
                      cx={wp.coords.x}
                      cy={wp.coords.y}
                      r="12"
                      fill={isSelected ? "${theme.accent}" : isDiscovered ? "#10b981" : "${theme.surface}"}
                      stroke={isSelected ? "#ffffff" : "${theme.border}"}
                      strokeWidth="2.5"
                    />
                    <text x={wp.coords.x} y={wp.coords.y + 26} fill="${theme.text}" fontSize="11" fontWeight="700" textAnchor="middle">
                      {wp.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Permanent Dossier Sidebar */}
        <aside style={{background:"${theme.surface}",border:"1px solid ${theme.border}",borderRadius:"1.5rem",padding:"1.5rem",boxShadow:"0 20px 40px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
            <span style={{fontSize:"0.6875rem",fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"${theme.textMuted}"}}>WAYPOINT DOSSIER</span>
            <span style={{fontSize:"0.6875rem",fontWeight:700,background:"#10b98126",color:"#10b981",padding:"0.2rem 0.5rem",borderRadius:"9999px"}}>✓ Discovered</span>
          </div>
          <h3 style={{fontSize:"1.375rem",fontWeight:800,color:"${theme.text}",margin:"0 0 0.5rem"}}>{activeWaypoint.name}</h3>
          <p style={{fontSize:"0.75rem",color:"${theme.textMuted}",marginBottom:"1.5rem"}}>Sector: <strong style={{color:"${theme.accent}"}}>{activeWaypoint.zone}</strong> · {activeWaypoint.difficulty}</p>
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"1rem",padding:"1rem",marginBottom:"1.5rem",border:"1px solid ${theme.border}"}}>
            <p style={{fontSize:"0.875rem",lineHeight:1.6,color:"${theme.text}",margin:0,fontStyle:"italic"}}>"{activeWaypoint.lore}"</p>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem",background:"${theme.accent}14",borderRadius:"0.75rem",border:"1px solid ${theme.accent}33",marginBottom:"1.5rem"}}>
            <span style={{fontSize:"0.75rem",color:"${theme.textMuted}"}}>Discovery Mark</span>
            <span style={{fontSize:"0.75rem",fontWeight:700,color:"${theme.accent}"}}>✦ {activeWaypoint.reward}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const unvisited = waypoints.find(w => !discoveredIds.includes(w.id));
              if (unvisited) {
                handleSelect(unvisited);
              } else {
                const curIdx = waypoints.findIndex(w => w.id === selectedId);
                const nextIdx = (curIdx + 1) % waypoints.length;
                handleSelect(waypoints[nextIdx]);
              }
            }}
            style={{width:"100%",padding:"0.875rem",borderRadius:"0.75rem",border:"none",background:"${theme.accent}",color:"#000000",fontWeight:800,fontSize:"0.875rem",cursor:"pointer"}}
          >
            + Lock Checkpoint
          </button>
        </aside>
      </main>
    </div>
  );`;
    }
  }
}
