/**
 * WorkspaceExperienceGenerator
 *
 * Generic experience-capability generator for interactive workspaces, telemetry consoles,
 * parameter configurators, diagnostic dashboards, and domain workbench canvases.
 *
 * Parametric & domain-agnostic: instantiated purely from active product semantics,
 * page experience plan, theme colors, and generation seed.
 */

export interface WorkspaceParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  description: string;
}

export interface WorkspaceMetric {
  id: string;
  label: string;
  format: string;
  badge: string;
  compute: string;
}

export interface WorkspaceExperienceGeneratorOptions {
  componentName: string;
  brandName: string;
  route: string;
  pageRole?: string;
  purpose?: string;
  prompt: string;
  seed?: number;
  domainKeywords?: string[];
  theme?: {
    bg?: string;
    surface?: string;
    border?: string;
    accent?: string;
    text?: string;
    textMuted?: string;
  };
}

export class WorkspaceExperienceGenerator {
  public static generate(options: WorkspaceExperienceGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42, route } = options;
    const promptLower = prompt.toLowerCase();

    const config = this.deriveConfig(promptLower, seed, route);
    const theme = options.theme || this.deriveTheme(promptLower);

    return `import React from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const initialParams = ${JSON.stringify(config.params, null, 4)};
  const quickActions = ${JSON.stringify(config.quickActions, null, 4)};
  const metricStreams = ${JSON.stringify(config.telemetryStreams, null, 4)};
  const summaryHeader = ${JSON.stringify(config.summaryHeader)};
  const summaryDescription = ${JSON.stringify(config.summaryDescription)};
  const [params, setParams] = React.useState<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    for (const p of initialParams) {
      acc[p.id] = p.defaultValue;
    }
    return acc;
  });

  const [activeTab, setActiveTab] = React.useState<"studio" | "metrics" | "records">("studio");
  const [auditLog, setAuditLog] = React.useState<Array<{ id: string; time: string; action: string; delta: string }>>([
    { id: "log-1", time: "10:42:01", action: "System Calibration Initialized", delta: "Baseline nominal" },
    { id: "log-2", time: "10:43:18", action: "Environmental Sweep Verified", delta: "Delta: +0.04%" }
  ]);
  const [isRunningSim, setIsRunningSim] = React.useState(false);
  const [simStep, setSimStep] = React.useState(0);

  const handleParamChange = (id: string, val: number) => {
    setParams(prev => ({ ...prev, [id]: val }));
    const paramMeta = initialParams.find(p => p.id === id);
    const timeStr = new Date().toLocaleTimeString();
    setAuditLog(prev => [
      {
        id: "log-" + Date.now(),
        time: timeStr,
        action: "Tuned " + (paramMeta?.label || id),
        delta: "Set to " + val + (paramMeta?.unit ? " " + paramMeta.unit : "")
      },
      ...prev.slice(0, 15)
    ]);
  };

  const handleRunSimulation = () => {
    setIsRunningSim(true);
    let s = 0;
    const interval = setInterval(() => {
      s += 1;
      setSimStep(s);
      if (s >= 5) {
        clearInterval(interval);
        setIsRunningSim(false);
        const timeStr = new Date().toLocaleTimeString();
        setAuditLog(prev => [
          {
            id: "log-" + Date.now(),
            time: timeStr,
            action: "Diagnostic Simulation Completed",
            delta: "All parameters converged within safety margins"
          },
          ...prev.slice(0, 15)
        ]);
      }
    }, 400);
  };

  // Derived live metrics computed from parameters
  const primaryEfficiency = Math.min(100, Math.round(((params[initialParams[0]?.id || "p1"] || 50) * 0.7) + ((params[initialParams[1]?.id || "p2"] || 50) * 0.3)));
  const systemLoad = Math.min(100, Math.round(((params[initialParams[2]?.id || "p3"] || 40) * 0.8) + 12));

  return (
    <div
      data-page-role="workspace"
      data-experience-capability="WORKSPACE_TOOL"
      data-aegis-experience="WORKSPACE"
      style={{
        minHeight: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          maxWidth: "1400px",
          margin: "0 auto 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          borderBottom: "1px solid ${theme.border}",
          paddingBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <Link
              to="/"
              style={{
                color: "${theme.accent}",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              ← ${brandName}
            </Link>
            <span style={{ color: "${theme.border}" }}>/</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "${theme.textMuted}" }}>
              ${config.workspaceCategory}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            ${options.pageRole || config.title}
          </h1>
          <p style={{ margin: "0.35rem 0 0", color: "${theme.textMuted}", fontSize: "0.9375rem" }}>
            ${config.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              background: "${theme.surface}",
              border: "1px solid ${theme.border}",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isRunningSim ? "#f59e0b" : "#10b981",
                boxShadow: isRunningSim ? "0 0 8px #f59e0b" : "0 0 8px #10b981",
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 600 }}>{isRunningSim ? "Simulation Active..." : "Workbench Online"}</span>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={isRunningSim}
            style={{
              background: "${theme.accent}",
              color: "#000",
              fontWeight: 700,
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.65rem 1.25rem",
              fontSize: "0.875rem",
              cursor: isRunningSim ? "not-allowed" : "pointer",
              opacity: isRunningSim ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {isRunningSim ? "Executing (" + simStep + "/5)..." : "Run Diagnostics ⚡"}
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "340px 1fr 320px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Control Panel: Parameter Tuners */}
        <div
          style={{
            background: "${theme.surface}",
            border: "1px solid ${theme.border}",
            borderRadius: "1rem",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "${theme.accent}" }}>
              Parameter Controls
            </span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.25rem 0 0" }}>Calibration Knobs</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {initialParams.map((p) => {
              const val = params[p.id] ?? p.defaultValue;
              return (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600 }}>{p.label}</span>
                    <span style={{ color: "${theme.accent}", fontFamily: "monospace", fontWeight: 700 }}>
                      {val} {p.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={val}
                    onChange={(e) => handleParamChange(p.id, Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: "${theme.accent}",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "${theme.textMuted}" }}>{p.description}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              const acc: Record<string, number> = {};
              for (const p of initialParams) {
                acc[p.id] = p.defaultValue;
              }
              setParams(acc);
            }}
            style={{
              background: "transparent",
              border: "1px solid ${theme.border}",
              color: "${theme.textMuted}",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reset to Nominal Baseline
          </button>
        </div>

        {/* Center Canvas: Live Telemetry & Visualizer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid ${theme.border}",
              paddingBottom: "0.5rem",
            }}
          >
            {(["studio", "metrics", "records"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? "${theme.surface}" : "transparent",
                  border: activeTab === tab ? "1px solid ${theme.border}" : "1px solid transparent",
                  color: activeTab === tab ? "${theme.text}" : "${theme.textMuted}",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {tab === "studio" ? "Studio Canvas" : tab === "metrics" ? "${brandName || "Workspace"} Insights" : "Audit Records"}
              </button>
            ))}
          </div>

          {activeTab === "studio" && (
            <div
              style={{
                background: "${theme.surface}",
                border: "1px solid ${theme.border}",
                borderRadius: "1rem",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Real-Time System Feedback</h3>
                <span style={{ fontSize: "0.75rem", color: "${theme.textMuted}" }}>60 FPS Vector Render</span>
              </div>

              {/* Reactive Visualizer Canvas */}
              <div
                style={{
                  height: "320px",
                  borderRadius: "0.75rem",
                  background: "radial-gradient(ellipse at 50% 50%, ${theme.accent}12, #050b14)",
                  border: "1px dashed ${theme.border}",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="${theme.accent}" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="${theme.accent}" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic wave reflecting current slider parameters */}
                  <path
                    d={\`M 0 \${150 + Math.sin(1) * (params[initialParams[0]?.id || "p1"] || 30) * 0.5} \${Array.from({ length: 12 })
                      .map((_, i) => {
                        const x = (i + 1) * 50;
                        const y = 150 + Math.sin((i + 1) * 0.8 + (params[initialParams[1]?.id || "p2"] || 20) * 0.05) * ((params[initialParams[0]?.id || "p1"] || 40) * 0.6);
                        return \`L \${x} \${y}\`;
                      })
                      .join(" ")}\`}
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth="3.5"
                  />

                  {/* Scatter points for active nodes */}
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const cx = 60 + idx * 80;
                    const cy = 150 + Math.sin(idx + 1) * ((params[initialParams[0]?.id || "p1"] || 30) * 0.4);
                    return (
                      <g key={idx}>
                        <circle cx={cx} cy={cy} r={6} fill="${theme.accent}" />
                        <circle cx={cx} cy={cy} r={12} fill="none" stroke="${theme.accent}" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                      </g>
                    );
                  })}
                </svg>

                <div
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    left: "1rem",
                    right: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <span>Harmonic Convergence: {primaryEfficiency}%</span>
                  <span>Operational Load: {systemLoad}%</span>
                  <span>Vector Nodes: 7 Synchronized</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const timeStr = new Date().toLocaleTimeString();
                      setAuditLog(prev => [{ id: "log-" + Date.now(), time: timeStr, action: action.name, delta: action.effect }, ...prev]);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid ${theme.border}",
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      textAlign: "left",
                      color: "${theme.text}",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{action.name}</span>
                    <span style={{ fontSize: "0.6875rem", color: "${theme.textMuted}" }}>{action.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div
              style={{
                background: "${theme.surface}",
                border: "1px solid ${theme.border}",
                borderRadius: "1rem",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Performance & Operational Indicators</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                {metricStreams.map((stream, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid ${theme.border}",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "${theme.textMuted}", textTransform: "uppercase" }}>
                      {stream.label}
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "${theme.accent}", margin: "0.25rem 0" }}>
                      {stream.value}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "#10b981" }}>{stream.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div
              style={{
                background: "${theme.surface}",
                border: "1px solid ${theme.border}",
                borderRadius: "1rem",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Action & Calibration Ledger</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {auditLog.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.5rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid ${theme.border}",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <span style={{ fontFamily: "monospace", color: "${theme.textMuted}" }}>{log.time}</span>
                      <span style={{ fontWeight: 600 }}>{log.action}</span>
                    </div>
                    <span style={{ color: "${theme.accent}" }}>{log.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Stats Rail: Live Meters & Diagnostic Summary */}
        <div
          style={{
            background: "${theme.surface}",
            border: "1px solid ${theme.border}",
            borderRadius: "1rem",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "${theme.accent}" }}>
              Diagnostic Metrics
            </span>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0.25rem 0 0" }}>System Vitals</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.35rem" }}>
                <span style={{ color: "${theme.textMuted}" }}>Convergence Efficiency</span>
                <span style={{ fontWeight: 700, color: "${theme.accent}" }}>{primaryEfficiency}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: primaryEfficiency + "%", background: "${theme.accent}", borderRadius: "9999px", transition: "width 0.3s" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.35rem" }}>
                <span style={{ color: "${theme.textMuted}" }}>Operational Load</span>
                <span style={{ fontWeight: 700, color: systemLoad > 80 ? "#ef4444" : "#10b981" }}>{systemLoad}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: systemLoad + "%", background: systemLoad > 80 ? "#ef4444" : "#10b981", borderRadius: "9999px", transition: "width 0.3s" }} />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed ${theme.border}",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "${theme.text}" }}>{summaryHeader}</span>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "${theme.textMuted}", lineHeight: 1.5 }}>
              {summaryDescription}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ${componentName};
`;
  }

  private static deriveConfig(promptLower: string, seed: number, route: string) {
    const isOcean = /\b(underwater|marine|ocean|submersible|hadal|bathymetr|hydrophone|benthic|abyss)\b/i.test(promptLower);
    const isFurniture = /furniture|chair|table|sofa|wood|interior|design|configurator/i.test(promptLower);
    const isMusic = /music|sound|audio|synthesizer|frequency|melody|harmonic/i.test(promptLower);
    const isClimate = /climate|weather|atmosphere|carbon|emissions|energy|planet/i.test(promptLower);
    const isSpace = /\b(space|celestial|orbit|orbital|satellite|planetary|astro|astronomy|observatory|telescope|starmap|star map)\b/i.test(promptLower);

    if (isClimate) {
      return {
        workspaceCategory: "Atmospheric Simulation Console",
        title: "Planetary Carbon & Flux Workbench",
        subtitle: "Model atmospheric carbon capture, solar radiation albedo, and renewable grid transition curves.",
        summaryHeader: "Planetary Equilibrium Status",
        summaryDescription: "Coupled climate-ocean circulation model calculating global mean surface temperature trajectories through 2050.",
        params: [
          { id: "carbonTax", label: "Carbon Removal Throughput", min: 0, max: 50, step: 1, unit: "Gt/yr", defaultValue: 18, description: "Direct air capture and biological sequestration capacity." },
          { id: "albedo", label: "Surface Albedo Reflectance", min: 0.25, max: 0.45, step: 0.01, unit: "index", defaultValue: 0.33, description: "Planetary surface reflectance across polar ice and urban canopies." },
          { id: "renewableShare", label: "Clean Generation Share", min: 20, max: 100, step: 5, unit: "%", defaultValue: 75, description: "Penetration of solar, wind, and storage on global transmission grid." },
        ],
        quickActions: [
          { name: "Run 2050 Climate Run", desc: "Execute multi-decade temperature model", effect: "Global warming stabilized at +1.3°C" },
          { name: "Simulate Cloud Seeding", desc: "Marine cloud brightening over tropics", effect: "Albedo delta: +0.02 index increase" },
          { name: "Grid Load Rebalance", desc: "Dynamic pumped hydro and battery shift", effect: "Zero curtailment across 4 continents" },
        ],
        telemetryStreams: [
          { label: "Atmospheric CO₂", value: "392 ppm", status: "Stabilization Trajectory" },
          { label: "Global Temp Delta", value: "+1.32°C", status: "Sub-1.5°C Paris Target" },
          { label: "Solar Energy Flux", value: "1,361 W/m²", status: "Solar Constant Baseline" },
          { label: "Ocean Heat Uptake", value: "312 ZJ", status: "Thermocline Buffer Active" },
        ],
      };
    }

    if (isSpace) {
      return {
        workspaceCategory: "Observatory Instrumentation & Telemetry Console",
        title: "Celestial Telemetry & Telescope Instrumentation Workbench",
        subtitle: "Calibrate optical apertures, radio interferometry arrays, and celestial target tracking coordinates.",
        summaryHeader: "Observatory Subsystem Status",
        summaryDescription: "High-altitude dome tracking online. Primary mirror cryogenic cooling and adaptive optics wavefront sensor operating within nominal tolerances.",
        params: [
          { id: "rightAscension", label: "Right Ascension Offset", min: 0, max: 24, step: 0.1, unit: "hrs", defaultValue: 14.4, description: "Celestial equatorial coordinate tracking axis." },
          { id: "declination", label: "Declination Angle", min: -90, max: 90, step: 1, unit: "°", defaultValue: 28, description: "Angular distance north or south of celestial equator." },
          { id: "exposureTime", label: "CCD Integration Exposure", min: 10, max: 3600, step: 10, unit: "s", defaultValue: 600, description: "Sensor light integration duration for deep-sky faint object capture." },
        ],
        quickActions: [
          { name: "Slew Telescope Mount", desc: "Align primary optical axis to target", effect: "Mount slewed to RA 14h 24m / Dec +28°" },
          { name: "Wavefront Calibration", desc: "Adaptive optics actuator correction", effect: "Atmospheric seeing tuned to 0.42 arcsec" },
          { name: "Initiate Spectral Capture", desc: "Expose multi-channel spectrograph", effect: "Spectrogram data written to FITS archive" },
        ],
        telemetryStreams: [
          { label: "Atmospheric Seeing", value: "0.42″", status: "Sub-Arcsecond Optimal" },
          { label: "Mirror Temp", value: "-12.4°C", status: "Cryogenic Equilibrium" },
          { label: "Dome Azimuth", value: "214.6°", status: "Target Synchronized" },
          { label: "Guide Star SNR", value: "48.2 dB", status: "Locked Optical Tracking" },
        ],
      };
    }

    if (isOcean) {
      return {
        workspaceCategory: "Submersible Telemetry Console",
        title: "Benthic Depth & Telemetry Workbench",
        subtitle: "Fine-tune hydrostatic ballast, sonar array frequency, and deep-sea specimen illumination.",
        summaryHeader: "Atmospheric & Pressure Status",
        summaryDescription: "Ballast tanks calibrated for abyssal descent. Sonar arrays scanning benthic trench contours in real-time.",
        params: [
          { id: "ballast", label: "Hydrostatic Ballast Level", min: 0, max: 100, step: 1, unit: "%", defaultValue: 65, description: "Controls negative buoyancy rate during trench descent." },
          { id: "sonarFreq", label: "Multi-Beam Sonar Frequency", min: 12, max: 200, step: 2, unit: "kHz", defaultValue: 88, description: "Determines spatial resolution vs penetration through benthic sediment." },
          { id: "lumenFlux", label: "Deep-Sea Luminescence Flux", min: 500, max: 12000, step: 250, unit: "lm", defaultValue: 4500, description: "Illuminates photophore pigmentation without blinding specimen optical nerves." },
        ],
        quickActions: [
          { name: "Execute Sonar Ping", desc: "Pulse high-frequency chirp into sediment", effect: "Echo returned: 420m floor contact" },
          { name: "Deploy Benthic Drone", desc: "Release autonomous specimen ROV", effect: "ROV unit online and tethered" },
          { name: "Flush Ballast Chamber", desc: "Purge seawater for rapid ascent", effect: "Ascent rate nominal at +1.2 m/s" },
        ],
        telemetryStreams: [
          { label: "Hydrostatic Pressure", value: "412.8 ATM", status: "Nominal Structural Stress" },
          { label: "Ambient Water Temp", value: "2.1°C", status: "Benthic Thermal Stability" },
          { label: "Salinity Gradient", value: "35.4 PSU", status: "Standard Halocline Layer" },
          { label: "Acoustic Noise Floor", value: "-84 dB", status: "Ultra-Quiet Trench Ambient" },
        ],
      };
    }

    if (isFurniture) {
      return {
        workspaceCategory: "Artisan Joinery Configurator",
        title: "Woodcraft & Ergonomics Workbench",
        subtitle: "Tune timber grain curvature, mortise-and-tenon tolerances, and natural oil finish luster.",
        summaryHeader: "Joinery Integrity Specs",
        summaryDescription: "Solid kiln-dried hardwoods with hand-finished bevels. Real-time stress distribution calculates continuous load capacity.",
        params: [
          { id: "backAngle", label: "Lumbar Incline Angle", min: 95, max: 115, step: 1, unit: "°", defaultValue: 104, description: "Ergonomic curvature angle for supported posture." },
          { id: "tenonDepth", label: "Mortise & Tenon Depth", min: 15, max: 45, step: 1, unit: "mm", defaultValue: 32, description: "Interlocking joint depth ensuring generational heirloom durability." },
          { id: "oilLuster", label: "Organic Linseed Luster", min: 1, max: 5, step: 1, unit: "coats", defaultValue: 3, description: "Micro-crystalline wax and hand-rubbed organic oil coats." },
        ],
        quickActions: [
          { name: "Stress Load Simulation", desc: "Simulate 250kg distributed pressure", effect: "Joint deflection 0.08mm: Certified Heirloom" },
          { name: "Grain Alignment Check", desc: "Inspect heartwood fiber continuity", effect: "Quarter-sawn grain aligned across frame" },
          { name: "Export Cut Sheet", desc: "Generate CNC & artisan timber specs", effect: "BOM manifest exported to workshop" },
        ],
        telemetryStreams: [
          { label: "Structural Modulus", value: "12.4 GPa", status: "White Oak Heirloom Standard" },
          { label: "Moisture Content", value: "7.8%", status: "Kiln-Dried Stable Equilibrium" },
          { label: "Max Load Rating", value: "320 kg", status: "Over-Engineered Safety Margin" },
          { label: "Hand-Finish Time", value: "14.2 hrs", status: "Master Artisan Benchmark" },
        ],
      };
    }


    const isArchitecture = /architecture|architect|journal|monograph|building|spatial|urban|tectonic|editorial|dispatch/i.test(promptLower);

    if (isArchitecture) {
      return {
        workspaceCategory: "Tectonic Specification & Monograph Workbench",
        title: "Architectural Studio & Spatial Parameter Console",
        subtitle: "Calibrate structural massing, daylight apertures, and material joinery tolerances across built monographs.",
        summaryHeader: "Tectonic Performance & Assembly Status",
        summaryDescription: "Monolithic assemblies and load-bearing timber frameworks validated against thermal mass and structural acoustic standards.",
        params: [
          { id: "wallThickness", label: "Basalt & Earth Wall Thickness", min: 300, max: 1200, step: 50, unit: "mm", defaultValue: 600, description: "Calibrates thermal lag and acoustic stillness within interior enclosures." },
          { id: "apertureRatio", label: "Solar Aperture Ratio", min: 10, max: 60, step: 5, unit: "%", defaultValue: 25, description: "Balances natural diffuse daylighting against solar thermal heat gain." },
          { id: "timberTension", label: "Glulam Truss Pre-Tension", min: 5, max: 40, step: 1, unit: "kN", defaultValue: 18, description: "Maintains structural stiffness across expansive column-free gallery spans." },
        ],
        quickActions: [
          { name: "Run Daylight Shadow Study", desc: "Simulate solar transit across solstice", effect: "Apertures optimized for diffuse northern light" },
          { name: "Verify Acoustic Dampening", desc: "Calculate reverberation time in civic hall", effect: "Reverberation time tuned to 1.1s standard" },
          { name: "Export Tectonic Dossier", desc: "Download material and joinery specifications", effect: "Archival PDF dossier generated" },
        ],
        telemetryStreams: [
          { label: "Thermal Inertia", value: "8.4 hrs", status: "Subterranean Mass Standard" },
          { label: "Daylight Factor", value: "3.2% DF", status: "Optimal Gallery Illumination" },
          { label: "Acoustic Attenuation", value: "-46 dB", status: "Porous Plaster Isolation" },
          { label: "Structural Redundancy", value: "2.4x", status: "Generational Seismic Reserve" },
        ],
      };
    }

    // Default General Purpose Domain Config (Domain-neutral, zero telemetry/startup jargon)
    return {
      workspaceCategory: "Interactive Studio Workbench",
      title: "Interactive Workspace & Parameter Console",
      subtitle: "Calibrate operational thresholds, analyze dynamic indicators, and inspect active feedback loops.",
      summaryHeader: "System Readiness & Status",
      summaryDescription: "All core subsystems online. Parameters are continuously monitored and validated against safe operating boundaries.",
      params: [
        { id: "intensity", label: "Core Processing Intensity", min: 10, max: 100, step: 5, unit: "%", defaultValue: 60, description: "Regulates throughput speed and resource allocation." },
        { id: "sensitivity", label: "Signal Detection Sensitivity", min: 1, max: 10, step: 0.5, unit: "index", defaultValue: 6.5, description: "Adjusts threshold to balance noise reduction with coverage." },
        { id: "damping", label: "Harmonic Damping Ratio", min: 0.1, max: 1.0, step: 0.05, unit: "ratio", defaultValue: 0.7, description: "Prevents operational oscillation during rapid state transitions." },
      ],
      quickActions: [
        { name: "Trigger Diagnostic Audit", desc: "Run comprehensive diagnostic pass", effect: "All nodes passed verification" },
        { name: "Calibrate Parameters", desc: "Zero out drift across input channels", effect: "Calibration completed nominal" },
        { name: "Export State Snapshot", desc: "Download timestamped system state", effect: "Configuration packet saved" },
      ],
      telemetryStreams: [
        { label: "Operational Integrity", value: "98.4%", status: "Optimal Balance" },
        { label: "Response Latency", value: "1.2 ms", status: "Nominal Baseline" },
        { label: "Operating Capacity", value: "58.4%", status: "Within Target Bounds" },
        { label: "Active Stability", value: "99.2%", status: "Verified Stable" },
      ],
    };
  }

  private static deriveTheme(promptLower: string): { bg: string; surface: string; border: string; accent: string; text: string; textMuted: string } {
    if (/underwater|ocean|marine|sea|submersible|deep|trench/i.test(promptLower)) {
      return {
        bg: "linear-gradient(170deg,#030b17 0%,#061a2f 50%,#020811 100%)",
        surface: "rgba(6,26,47,0.8)",
        border: "rgba(0,240,255,0.2)",
        accent: "#00f0ff",
        text: "#e2f1f8",
        textMuted: "#6ba2bf",
      };
    }
    if (/furniture|wood|interior|artisan/i.test(promptLower)) {
      return {
        bg: "linear-gradient(170deg,#14120f 0%,#1c1813 50%,#0e0c0a 100%)",
        surface: "rgba(28,24,19,0.85)",
        border: "rgba(217,119,6,0.25)",
        accent: "#d97706",
        text: "#fef3c7",
        textMuted: "#b45309",
      };
    }
    if (/climate|weather|nature|botanical/i.test(promptLower)) {
      return {
        bg: "linear-gradient(170deg,#04130d 0%,#0a2318 50%,#020b07 100%)",
        surface: "rgba(10,35,24,0.8)",
        border: "rgba(16,185,129,0.25)",
        accent: "#10b981",
        text: "#ecfdf5",
        textMuted: "#6ee7b7",
      };
    }
    return {
      bg: "linear-gradient(170deg,#090d16 0%,#111827 50%,#070a10 100%)",
      surface: "rgba(17,24,39,0.85)",
      border: "rgba(59,130,246,0.2)",
      accent: "#3b82f6",
      text: "#f9fafb",
      textMuted: "#9ca3af",
    };
  }
}
