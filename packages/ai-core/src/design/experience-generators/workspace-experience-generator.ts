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
    const { componentName, brandName, prompt, seed = 42, route, pageRole, purpose } = options;
    const promptLower = prompt.toLowerCase();

    const config = this.deriveConfig(promptLower, seed, route, pageRole, purpose);
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

  private static deriveConfig(promptLower: string, seed: number, route?: string, pageRole?: string, purpose?: string) {
    const isOcean = /\b(underwater|marine|ocean|submersible|hadal|bathymetr|hydrophone|benthic|abyss)\b/i.test(promptLower);
    const isFurniture = /furniture|chair|table|sofa|wood|interior|design|configurator/i.test(promptLower);
    const isMusic = /music|sound|audio|synthesizer|frequency|melody|harmonic/i.test(promptLower);
    const isClimate = /climate|weather|atmosphere|carbon|emissions|albedo|planet/i.test(promptLower);
    const isSpace = /\b(space|celestial|orbit|orbital|satellite|planetary|astro|astronomy|observatory|telescope|starmap|star map)\b/i.test(promptLower);
    const isCleanEnergy = !isClimate && !isSpace && !isOcean && /\b(renewable|clean energy|greenpulse|energy operations|power grid|microgrid|photovoltaic|inverter|turbine|wind farm)\b/i.test(promptLower);

    const routeContext = `${route || ""} ${pageRole || ""} ${purpose || ""}`.toLowerCase();
    const isAnalyticsRoute = /analytic|trend|telemetry|waveform|performance|metric|spectral|photometry/i.test(routeContext);
    const isIncidentsRoute = /incident|alert|triage|escalation|fault|alarm|safety|emergency/i.test(routeContext);
    const isMaintenanceRoute = /maintenance|technician|work-order|schedule|dispatch|service|preventive/i.test(routeContext);
    const isReportsRoute = /report|compliance|audit|summary|export|log|regulatory/i.test(routeContext);

    if (isCleanEnergy) {
      if (isAnalyticsRoute) {
        return {
          workspaceCategory: "Grid Performance & Telemetry Analysis",
          title: "Harmonic Distortion & Transmission Telemetry Workbench",
          subtitle: "Analyze power factor harmonics, degradation curves, and real-time solar/wind generation efficiency.",
          summaryHeader: "Grid Stability & Spectral Purity Status",
          summaryDescription: "Continuous telemetry ingestion measuring phase angle, grid frequency variance, and transmission losses across substations.",
          params: [
            { id: "sampleWindow", label: "Telemetry Sample Window", min: 1, max: 72, step: 1, unit: "hrs", defaultValue: 24, description: "Historical telemetry integration buffer." },
            { id: "harmonicFilter", label: "Harmonic Distortion Ceiling", min: 0.5, max: 5.0, step: 0.1, unit: "% THD", defaultValue: 1.5, description: "Total harmonic distortion tolerance across feeder lines." },
            { id: "degradationFactor", label: "PV Degradation Model Rate", min: 0.1, max: 2.0, step: 0.05, unit: "%/yr", defaultValue: 0.5, description: "Annualized photovoltaic module efficiency decay curve." },
          ],
          quickActions: [
            { name: "Run Spectral FFT Analysis", desc: "Decompose grid transmission harmonics", effect: "FFT completed: 1.18% THD nominal" },
            { name: "Simulate Heatwave Degradation", desc: "Model elevated ambient cell temperature", effect: "Efficiency adjusted: -1.2% delta" },
            { name: "Export Telemetry Dataset", desc: "Compile multi-channel time-series telemetry", effect: "Dataset staged for export" },
          ],
          telemetryStreams: [
            { label: "Grid Frequency Jitter", value: "±0.02 Hz", status: "Sub-Cycle Synchronized" },
            { label: "Power Factor", value: "0.992 pf", status: "High Efficiency Nominal" },
            { label: "Telemetry Ingestion", value: "48.2k pts/s", status: "Zero Loss Buffer" },
            { label: "Lifetime Generation", value: "142.8 GWh", status: "Certified Production" },
          ],
        };
      }

      if (isIncidentsRoute) {
        return {
          workspaceCategory: "Operational Incident Triage & Emergency Protocols",
          title: "Grid Fault Isolation & Alert Triage Console",
          subtitle: "Manage critical substation trips, inverter ground faults, emergency islanding, and escalation queues.",
          summaryHeader: "Active Incident & Safety Triage Status",
          summaryDescription: "Automated protection relays armed. Real-time telemetry monitoring arc fault detection and breaker trips.",
          params: [
            { id: "tripSensitivity", label: "Protection Relay Sensitivity", min: 10, max: 100, step: 5, unit: "A", defaultValue: 35, description: "Ground fault breaker trip current threshold." },
            { id: "escalationTimeout", label: "Incident Escalation Timeout", min: 5, max: 60, step: 5, unit: "min", defaultValue: 15, description: "Maximum duration before unresolved alert escalates to grid operator." },
            { id: "islandingBuffer", label: "Emergency Islanding Delay", min: 10, max: 200, step: 10, unit: "ms", defaultValue: 40, description: "Microgrid disconnect delay upon loss of transmission feed." },
          ],
          quickActions: [
            { name: "Acknowledge Active Alarms", desc: "Silence audible SCADA chimes for current alerts", effect: "All pending alarms acknowledged" },
            { name: "Isolate Feeder Circuit", desc: "Open high-voltage breaker on compromised feeder", effect: "Feeder B-12 safely isolated" },
            { name: "Trigger Emergency Dispatch", desc: "Notify nearest high-voltage certified crew", effect: "Emergency ticket dispatched" },
          ],
          telemetryStreams: [
            { label: "Active Critical Alarms", value: "0 Critical", status: "All Circuits Clear" },
            { label: "Advisory Notifications", value: "2 Advisory", status: "Review Scheduled" },
            { label: "Mean Time to Triage", value: "48 sec", status: "Well Within SLA" },
            { label: "Isolation Relay Health", value: "100%", status: "Self-Test Passed" },
          ],
        };
      }

      if (isMaintenanceRoute) {
        return {
          workspaceCategory: "Preventive Maintenance & Field Technician Dispatch",
          title: "Work Order Scheduling & Field Service Workbench",
          subtitle: "Coordinate turbine gearbox lubrication, inverter replacements, thermographic drone scans, and crew schedules.",
          summaryHeader: "Fleet Maintenance & Crew Readiness",
          summaryDescription: "Field service logistics console tracking scheduled preventative maintenance across renewable generation assets.",
          params: [
            { id: "inspectionInterval", label: "Drone Thermography Cycle", min: 30, max: 180, step: 15, unit: "days", defaultValue: 90, description: "Recurrence window for aerial infrared inspection of solar arrays." },
            { id: "crewShiftCapacity", label: "Active Technician Capacity", min: 2, max: 24, step: 1, unit: "crews", defaultValue: 8, description: "Certified high-voltage field technician teams on active duty." },
            { id: "sparePartBuffer", label: "Inverter Module Buffer", min: 5, max: 50, step: 5, unit: "units", defaultValue: 20, description: "Critical replacement components stored at regional depot." },
          ],
          quickActions: [
            { name: "Dispatch Thermography Drone", desc: "Launch autonomous IR inspection across Array 4", effect: "Drone flight path uploaded" },
            { name: "Schedule Nacelle Service", desc: "Book crane and technician team for Turbine W-08", effect: "Work order WO-8841 generated" },
            { name: "Reorder Spare Inverters", desc: "Replenish 250kW central inverter inventory", effect: "Procurement request submitted" },
          ],
          telemetryStreams: [
            { label: "Scheduled Work Orders", value: "14 Planned", status: "On Track This Week" },
            { label: "Completed This Month", value: "42 Orders", status: "98% First-Time Fix" },
            { label: "Mean Time Between Faults", value: "1,420 hrs", status: "Optimal Asset Health" },
            { label: "Field Crews Deployed", value: "6 / 8 Active", status: "Nominal Staffing" },
          ],
        };
      }

      if (isReportsRoute) {
        return {
          workspaceCategory: "Regulatory Compliance & ESG Generation Reports",
          title: "Executive Compliance & Generation Audit Workbench",
          subtitle: "Generate grid interconnection reports, clean energy tax credit manifests, carbon offsets, and executive summaries.",
          summaryHeader: "Regulatory Audit & Environmental Accounting",
          summaryDescription: "Audited time-stamped generation logs certified for renewable portfolio standard (RPS) compliance.",
          params: [
            { id: "reportingPeriod", label: "Audit Aggregation Window", min: 7, max: 365, step: 7, unit: "days", defaultValue: 30, description: "Timeframe for compiled generation and compliance summaries." },
            { id: "carbonCreditRate", label: "Emissions Abatement Baseline", min: 0.4, max: 1.2, step: 0.05, unit: "tCO₂/MWh", defaultValue: 0.82, description: "Regional grid emissions displacement factor." },
            { id: "gridCodeTolerance", label: "Frequency Compliance Margin", min: 95, max: 100, step: 0.5, unit: "%", defaultValue: 99.5, description: "Required percentage of generation within tight frequency limits." },
          ],
          quickActions: [
            { name: "Export ESG Compliance Pack", desc: "Compile certified audit pack with cryptographic hash", effect: "ESG_Report_2026.pdf staged" },
            { name: "Audit Interconnection Log", desc: "Cross-reference hourly generation with grid meter", effect: "Audit variance: 0.01% (PASS)" },
            { name: "Generate Carbon Manifest", desc: "Calculate total displaced carbon emissions", effect: "Manifest signed: 1,240 tCO₂e" },
          ],
          telemetryStreams: [
            { label: "RPS Compliance Index", value: "100%", status: "Fully Certified" },
            { label: "Audited Net Export", value: "24.6 GWh", status: "Grid Operator Verified" },
            { label: "Total Carbon Abated", value: "20,172 tCO₂", status: "Third-Party Validated" },
            { label: "Report Delivery Status", value: "Up to Date", status: "Next Audit in 16 Days" },
          ],
        };
      }

      return {
        workspaceCategory: "Renewable Generation & Dispatch Console",
        title: "Solar & Wind Dispatch Telemetry Workbench",
        subtitle: "Monitor active solar irradiance, wind turbine yaw telemetry, inverter efficiency, and grid transmission dispatch.",
        summaryHeader: "Grid Generation & Capacity Status",
        summaryDescription: "Real-time dispatch across utility-scale photovoltaic arrays and offshore wind farms feeding the regional transmission grid.",
        params: [
          { id: "gridFrequency", label: "Grid Dispatch Target", min: 45, max: 65, step: 0.1, unit: "Hz", defaultValue: 50.0, description: "Synchronized transmission frequency baseline." },
          { id: "batteryReserve", label: "BESS Storage Buffer", min: 10, max: 100, step: 5, unit: "%", defaultValue: 82, description: "Battery Energy Storage System reserve dispatch readiness." },
          { id: "curtailmentThreshold", label: "Turbine Pitch Curtailment", min: 0, max: 25, step: 1, unit: "MW", defaultValue: 5, description: "Dynamic curtailment ceiling during peak generation." },
        ],
        quickActions: [
          { name: "Optimize Inverter Banks", desc: "Maximize MPPT efficiency across solar arrays", effect: "PV output boosted by +3.4%" },
          { name: "Wind Turbine Yaw Align", desc: "Vector nacelles toward prevailing wind corridor", effect: "Aerodynamic yield optimized +5.1%" },
          { name: "Dispatch BESS Storage", desc: "Discharge 50MW storage into peak evening grid", effect: "Peak grid congestion mitigated" },
        ],
        telemetryStreams: [
          { label: "Total Generation", value: "842.6 MW", status: "Nominal Export" },
          { label: "Solar Inverter Yield", value: "520.4 MW", status: "Peak Irradiance" },
          { label: "Wind Farm Fleet", value: "322.2 MW", status: "Optimal Yaw" },
          { label: "Grid Carbon Offset", value: "1,240 tCO₂e", status: "Active Abatement" },
        ],
      };
    }

    if (isClimate) {
      if (isAnalyticsRoute) {
        return {
          workspaceCategory: "Global Emissions & Trajectory Console",
          title: "Carbon Budget & Emissions Analysis Workbench",
          subtitle: "Analyze greenhouse gas flux trajectories, sectoral emissions breakdowns, and mitigation scenarios.",
          summaryHeader: "Global Emissions Ledger Status",
          summaryDescription: "Multi-sector emissions accounting modeling carbon capture scalability and anthropogenic reductions.",
          params: [
            { id: "carbonPrice", label: "Effective Carbon Pricing", min: 20, max: 200, step: 5, unit: "$/t", defaultValue: 85, description: "Global economic carbon pricing benchmark." },
            { id: "methaneAbate", label: "Methane Abatement Rate", min: 10, max: 80, step: 5, unit: "%", defaultValue: 45, description: "Targeted fugitive emissions mitigation across industry." },
            { id: "dacCapacity", label: "Direct Air Capture Capacity", min: 1, max: 30, step: 1, unit: "Mt/yr", defaultValue: 12, description: "Industrial DAC modular deployment throughput." },
          ],
          quickActions: [
            { name: "Run 1.5°C Scenario", desc: "Compute net-zero emissions curve", effect: "Net-zero target aligned for 2045" },
            { name: "Evaluate Methane Cap", desc: "Model flaring elimination across wells", effect: "Global cooling delta: -0.08°C" },
            { name: "Export Emissions Report", desc: "Generate UNFCCC carbon audit log", effect: "Emissions manifest exported" },
          ],
          telemetryStreams: [
            { label: "Atmospheric CO₂", value: "392 ppm", status: "Stabilization Trajectory" },
            { label: "Methane Intensity", value: "1,840 ppb", status: "Declining Curve" },
            { label: "Global Temp Delta", value: "+1.32°C", status: "Sub-1.5°C Paris Target" },
            { label: "Carbon Budget Remaining", value: "240 Gt", status: "Monitored Reserve" },
          ],
        };
      }

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
      const isManeuverRoute = /maneuver|burn|propulsion|delta-v|thruster|orbit-raise|transfer|trajectory-correction/i.test(routeContext);
      const isTrajectoryRoute = /trajectory|orbit|visualize|tracking|ground-track|propagation|constellation|ephemeris/i.test(routeContext);
      const isSubsystemsRoute = /subsystem|power|solar|battery|thermal|telemetry|sensor|bus|payload|radiator/i.test(routeContext);
      const isDownlinkRoute = /downlink|ground-station|pass|station|antenna|rf|pass-scheduler|scheduler|contact/i.test(routeContext);
      const isCommandRoute = /command|uplink|audit|log|encrypt|security|crypto|dispatch|telecommand/i.test(routeContext);

      if (isManeuverRoute) {
        return {
          workspaceCategory: "Orbital Maneuver & Propulsion Console",
          title: "Orbital Maneuver Burn & Delta-V Planner",
          subtitle: "Calculate Hohmann transfer windows, configure RCS thruster burn durations, and execute delta-v vector burns.",
          summaryHeader: "Orbital Propulsion & Vector Status",
          summaryDescription: "Hydrazine RCS manifolds pressurized. Inertial measurement guidance system synchronized with ephemeris state vectors.",
          params: [
            { id: "deltaVTarget", label: "Prograde Delta-V Budget", min: 1, max: 500, step: 5, unit: "m/s", defaultValue: 45, description: "Total velocity increment for orbital altitude adjustment." },
            { id: "burnDuration", label: "Hydrazine Thruster Burn Time", min: 5, max: 300, step: 1, unit: "s", defaultValue: 38, description: "Continuous firing duration for primary bi-propellant thrusters." },
            { id: "perigeeTarget", label: "Target Perigee Altitude", min: 200, max: 2000, step: 10, unit: "km", defaultValue: 520, description: "Target orbital perigee altitude following insertion burn." },
          ],
          quickActions: [
            { name: "Compute Hohmann Transfer", desc: "Calculate orbital transfer burn arc", effect: "Transfer solution computed: Δv 45.2 m/s" },
            { name: "Arm RCS Thruster Pods", desc: "Pre-pressurize propellant manifolds and igniters", effect: "Propellant manifold pressurized to 22.4 bar" },
            { name: "Upload Burn Sequence", desc: "Encrypt and upload timed burn commands to flight computer", effect: "Burn packet scheduled for execution at ascending node" },
          ],
          telemetryStreams: [
            { label: "Target Apogee", value: "1,240 km", status: "Orbit Insertion Nominal" },
            { label: "Propellant Mass", value: "48.2 kg", status: "Hydrazine Reserve: 91%" },
            { label: "RCS Chamber Pressure", value: "22.4 bar", status: "Nominal Firing Threshold" },
            { label: "Guidance IMU Alignment", value: "99.98%", status: "Inertial Lock Verified" },
          ],
        };
      }

      if (isTrajectoryRoute) {
        return {
          workspaceCategory: "Constellation Trajectory & Ephemeris Console",
          title: "Satellite Trajectory & Orbital Ephemeris Workbench",
          subtitle: "Propagate SGP4 orbital state vectors, model RAAN plane separation, and analyze conjunction encounter geometry.",
          summaryHeader: "Orbital State Vector & Ephemeris Status",
          summaryDescription: "Constellation orbits propagated via SGP4 high-precision gravity model. Zero high-probability conjunction risks detected in lookahead window.",
          params: [
            { id: "inclination", label: "Orbital Inclination Angle", min: 0, max: 110, step: 0.5, unit: "°", defaultValue: 53.2, description: "Orbital tilt relative to the equatorial plane." },
            { id: "raanOffset", label: "RAAN Plane Separation", min: 0, max: 360, step: 5, unit: "°", defaultValue: 72, description: "Right Ascension of Ascending Node spacing between orbital planes." },
            { id: "propagationWindow", label: "Ephemeris Orbit Lookahead", min: 1, max: 72, step: 1, unit: "hrs", defaultValue: 24, description: "Time horizon for numerical trajectory propagation." },
          ],
          quickActions: [
            { name: "Propagate SGP4 State", desc: "Propagate TLE orbital state vectors over time horizon", effect: "SGP4 state vectors updated: 0.02km error bound" },
            { name: "Conjunction Risk Assessment", desc: "Scan Space-Track catalog for orbital close approaches", effect: "Zero high-probability conjunctions detected (< 5km)" },
            { name: "Generate Ground Track", desc: "Calculate sub-satellite point track and sensor swath", effect: "Ground track projected across 16 orbital passes" },
          ],
          telemetryStreams: [
            { label: "Orbital Velocity", value: "7.66 km/s", status: "Low Earth Orbit Nominal" },
            { label: "Semi-Major Axis", value: "6,928 km", status: "Circularized 550km Orbit" },
            { label: "Eccentricity", value: "0.00084", status: "Near-Circular Geometry" },
            { label: "Tracked Conjunctions", value: "0 Alerts", status: "Clear Flight Corridor" },
          ],
        };
      }

      if (isSubsystemsRoute) {
        return {
          workspaceCategory: "Satellite Subsystem Health & Telemetry Console",
          title: "Subsystem Telemetry & Power Distribution Workbench",
          subtitle: "Monitor solar array photovoltaic power, battery state-of-charge, bus voltage rails, and thermal radiators.",
          summaryHeader: "Spacecraft Bus Subsystem Status",
          summaryDescription: "Electrical power subsystem operating in positive energy balance. Cryogenic and thermal louvers calibrated for eclipse transit.",
          params: [
            { id: "solarArrayAngle", label: "Solar Array Gimbal Bias", min: -90, max: 90, step: 1, unit: "°", defaultValue: 32, description: "Dual-axis solar array orientation angle toward the sun vector." },
            { id: "radiatorTempThreshold", label: "Thermal Loop Target Temp", min: -40, max: 85, step: 1, unit: "°C", defaultValue: 18, description: "Active thermal regulation setpoint for payload instrument bay." },
            { id: "batterySocLimit", label: "Eclipse Discharge Floor", min: 20, max: 80, step: 5, unit: "%", defaultValue: 40, description: "Maximum allowable battery depth-of-discharge during eclipse passes." },
          ],
          quickActions: [
            { name: "Run Subsystem Ping Sweep", desc: "Query all bus sensor interfaces and telemetry nodes", effect: "148 sensors responding within nominal spec" },
            { name: "Articulate Solar Panels", desc: "Orient dual-axis arrays toward optimum solar vector", effect: "Solar array tracking sun vector (+14.2% power)" },
            { name: "Cycle Radiator Heat Pipes", desc: "Open ammonia heat pipe valves for thermal dissipation", effect: "Loop temperature stabilized at 17.8°C" },
          ],
          telemetryStreams: [
            { label: "Solar Array Output", value: "3.42 kW", status: "Optimal Irradiance Angle" },
            { label: "Battery Bus Voltage", value: "28.4 V", status: "Fully Charged Nominal" },
            { label: "Bus Core Temp", value: "21.6°C", status: "Thermal Balance Maintained" },
            { label: "Telemetry Beacon", value: "100% OK", status: "High SNR Link Established" },
          ],
        };
      }

      if (isDownlinkRoute) {
        return {
          workspaceCategory: "Ground Station Pass & Downlink Console",
          title: "Ground Station Downlink Pass Scheduler Workbench",
          subtitle: "Schedule ground contact passes across Svalbard, Goldstone, and Madrid tracking stations.",
          summaryHeader: "Ground Segment Network & Pass Status",
          summaryDescription: "High-gain steerable dish antennas synchronized for horizon-to-horizon satellite passes with automated doppler correction.",
          params: [
            { id: "minElevationAngle", label: "Min Acquisition Elevation", min: 5, max: 45, step: 1, unit: "°", defaultValue: 10, description: "Minimum elevation angle above local horizon for ground station lock." },
            { id: "downlinkDataRate", label: "X-Band Downlink Throughput", min: 50, max: 1000, step: 25, unit: "Mbps", defaultValue: 350, description: "RF telemetry and payload science downlink data transfer rate." },
            { id: "rfCarrierFreq", label: "S-Band Telemetry Carrier", min: 2000, max: 2400, step: 10, unit: "MHz", defaultValue: 2245, description: "Telemetry tracking and command RF carrier frequency." },
          ],
          quickActions: [
            { name: "Acquire Ground Station Lock", desc: "Slew dish antenna to line-of-sight acquisition angle", effect: "Lock acquired: Goldstone Station (SNR 18.4 dB)" },
            { name: "Dump Payload Telemetry", desc: "Stream buffered high-res science and radar data", effect: "42.8 GB dumped over Svalbard pass (100% verified)" },
            { name: "Synchronize Ephemeris TLE", desc: "Upload calibrated orbital two-line element set", effect: "Onboard ephemeris synchronized with Norad TLE" },
          ],
          telemetryStreams: [
            { label: "Next Ground Pass", value: "14m 22s", status: "Svalbard Station AOS" },
            { label: "Link Margin", value: "+8.6 dB", status: "Exceeds BER 1e-9 Ceiling" },
            { label: "Data Buffer Backlog", value: "12.4 GB", status: "Clearable in 1 Pass" },
            { label: "Tracking Azimuth", value: "182.4°", status: "Dish Auto-Track Online" },
          ],
        };
      }

      if (isCommandRoute) {
        return {
          workspaceCategory: "Encrypted Satellite Command Uplink Console",
          title: "Cryptographic Command Uplink & Telecommand Log",
          subtitle: "Sign and transmit authenticated telecommand packets, monitor replay nonce windows, and verify command receipt.",
          summaryHeader: "Telecommand Uplink & Cryptographic Security",
          summaryDescription: "Hardware Security Module (HSM) online. Command authentication tokens signed with rotating session keys and verified via flight computer telemetry ACK.",
          params: [
            { id: "cryptoNonceWindow", label: "Replay Nonce Validity Window", min: 5, max: 120, step: 5, unit: "s", defaultValue: 30, description: "Time-to-live expiration window for telecommand nonce tokens." },
            { id: "uplinkPowerLevel", label: "Ground Uplink EIRP Power", min: 20, max: 80, step: 2, unit: "dBW", defaultValue: 54, description: "Effective Isotropic Radiated Power of uplink transmitter." },
            { id: "authKeyIndex", label: "Operational Key Slot Index", min: 1, max: 16, step: 1, unit: "slot", defaultValue: 4, description: "Active cryptographic key index in satellite hardware security module." },
          ],
          quickActions: [
            { name: "Sign Command Packet", desc: "HMAC-SHA256 sign telecommand with operational key", effect: "Packet signed: CRC32 and cryptographic token attached" },
            { name: "Transmit Critical Uplink", desc: "Beam telecommand burst via encrypted S-band carrier", effect: "Uplink confirmed: Flight computer ACK received" },
            { name: "Export Uplink Audit Trail", desc: "Compile immutable cryptographic audit trail of sent commands", effect: "Audit trail compiled: 142 commands exported" },
          ],
          telemetryStreams: [
            { label: "Telecommand State", value: "Armed", status: "Crypto Engine Synchronized" },
            { label: "Uplink Carrier Lock", value: "Locked", status: "Madrid Ground Terminal" },
            { label: "Auth Nonce Drift", value: "0.2 s", status: "Well Within Tolerance" },
            { label: "Rejected Packets", value: "0 Packets", status: "Zero Spoofing / Bit Flips" },
          ],
        };
      }

      if (isAnalyticsRoute) {
        return {
          workspaceCategory: "Spectral Absorption & Photometry Workbench",
          title: "Multi-Band Spectrogram & Radiometry Console",
          subtitle: "Analyze celestial absorption lines, stellar radial velocity, and exoplanet transit dips.",
          summaryHeader: "Spectral Ingestion & Signal Quality",
          summaryDescription: "Echelle spectrograph online. Calibrated thorium-argon laser frequency comb providing sub-m/s precision.",
          params: [
            { id: "spectralBandwidth", label: "Dispersion Bandwidth", min: 380, max: 920, step: 10, unit: "nm", defaultValue: 550, description: "Optical dispersion window across echelle grating." },
            { id: "snrThreshold", label: "Signal-to-Noise Floor", min: 10, max: 150, step: 5, unit: "SNR", defaultValue: 65, description: "Minimum detection significance for absorption line fitting." },
            { id: "velocityOffset", label: "Radial Velocity Correction", min: -100, max: 100, step: 1, unit: "km/s", defaultValue: 12, description: "Barycentric velocity adjustment accounting for Earth orbit." },
          ],
          quickActions: [
            { name: "Calibrate Laser Comb", desc: "Fire wavelength calibration laser comb", effect: "Instrument drift zeroed: < 0.1 m/s" },
            { name: "Exoplanet Transit Fit", desc: "Fold light curve to Kepler orbital model", effect: "Transit depth: 1.24% detected" },
            { name: "Export FITS Spectrum", desc: "Compress and sign scientific FITS data", effect: "FITS manifest written to storage" },
          ],
          telemetryStreams: [
            { label: "Radial Velocity", value: "+12.42 m/s", status: "Barycentric Compensated" },
            { label: "Spectral Resolution", value: "R ~ 115,000", status: "Ultra-High Precision" },
            { label: "Detector Quantum Eff.", value: "94.2%", status: "Cryo-CCD Optimal" },
            { label: "Processed Spectra", value: "1,840 Frames", status: "Fully Calibrated" },
          ],
        };
      }

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
        summaryHeader: "Benthic & Hydrostatic Status",
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

    // Default General Purpose Domain Config (Domain-neutral, route-differentiated to prevent convergence)
    const slug = (route || pageRole || "core").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "core";
    const slugLabel = slug.charAt(0).toUpperCase() + slug.slice(1);
    return {
      workspaceCategory: `${slugLabel} Interactive Studio Workbench`,
      title: `${slugLabel} Workspace & Parameter Console`,
      subtitle: "Calibrate operational thresholds, analyze dynamic indicators, and inspect active feedback loops.",
      summaryHeader: `${slugLabel} Readiness & Status`,
      summaryDescription: "All core subsystems online. Parameters are continuously monitored and validated against safe operating boundaries.",
      params: [
        { id: `${slug}Intensity`, label: `${slugLabel} Processing Intensity`, min: 10, max: 100, step: 5, unit: "%", defaultValue: 60, description: "Regulates throughput speed and resource allocation." },
        { id: `${slug}Sensitivity`, label: `${slugLabel} Detection Sensitivity`, min: 1, max: 10, step: 0.5, unit: "index", defaultValue: 6.5, description: "Adjusts threshold to balance noise reduction with coverage." },
        { id: `${slug}Damping`, label: `${slugLabel} Harmonic Damping`, min: 0.1, max: 1.0, step: 0.05, unit: "ratio", defaultValue: 0.7, description: "Prevents operational oscillation during rapid state transitions." },
      ],
      quickActions: [
        { name: `Run ${slugLabel} Diagnostic Audit`, desc: "Run comprehensive diagnostic pass", effect: "All nodes passed verification" },
        { name: `Calibrate ${slugLabel} Parameters`, desc: "Zero out drift across input channels", effect: "Calibration completed nominal" },
        { name: `Export ${slugLabel} State Snapshot`, desc: "Download timestamped system state", effect: "Configuration packet saved" },
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
    if (/space|celestial|orbit|orbital|satellite|astronomy|planetary/i.test(promptLower)) {
      return {
        bg: "linear-gradient(170deg,#050813 0%,#0a1128 50%,#030712 100%)",
        surface: "rgba(10,17,40,0.85)",
        border: "rgba(56,189,248,0.25)",
        accent: "#38bdf8",
        text: "#f0f9ff",
        textMuted: "#7dd3fc",
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
