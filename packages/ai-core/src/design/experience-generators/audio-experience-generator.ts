/**
 * AudioExperienceGenerator
 *
 * Generic experience-capability generator for tactile audio mixing consoles,
 * acoustic soundboards, ambient frequency synthesizers, and Web Audio studios.
 *
 * Parametric & domain-agnostic: instantiated purely from active product semantics,
 * page experience plan, theme colors, and generation seed.
 */

export interface SoundPad {
  id: string;
  name: string;
  icon: string;
  freq: number;
  wave: "sine" | "triangle" | "square" | "sawtooth";
  color: string;
  desc: string;
}

export interface AudioExperienceGeneratorOptions {
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

export class AudioExperienceGenerator {
  public static generate(options: AudioExperienceGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42 } = options;
    const promptLower = prompt.toLowerCase();
    const isMuseum = /\b(museum|art|gallery|exhibition|curator|artwork|cultural|heritage|sculpture)\b/i.test(promptLower);
    const headerSubtitle = isMuseum
      ? "Exhibition Audio Guide & Commentary"
      : "Tactile Audio Synthesis Studio";
    const headerTitle = isMuseum
      ? "Gallery Audio Guide & Curator Commentary"
      : "Acoustic & Resonance Console";
    const headerDescription = isMuseum
      ? "Select exhibition room tracks and curator commentary to accompany your walkthrough of the permanent collection and rotating exhibitions."
      : "Tap tactical pads to synthesize real-time harmonic frequencies calibrated to this domain.";

    const pads = this.derivePads(promptLower, seed);
    const theme = options.theme || this.deriveTheme(promptLower);

    return `import React from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const soundPads = ${JSON.stringify(pads, null, 4)};

  const [activePad, setActivePad] = React.useState<string | null>(null);
  const [ambientVol, setAmbientVol] = React.useState(60);
  const [reverbDepth, setReverbDepth] = React.useState(45);
  const [padsTriggered, setPadsTriggered] = React.useState(0);

  const playTone = (pad: typeof soundPads[0]) => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = pad.wave as any;
      osc.frequency.setValueAtTime(pad.freq, ctx.currentTime);

      const targetGain = 0.25 * (ambientVol / 100);
      gain.gain.setValueAtTime(targetGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (reverbDepth / 50));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (reverbDepth / 50));
    } catch {}

    setActivePad(pad.id);
    setPadsTriggered(p => p + 1);
    setTimeout(() => setActivePad(null), 500);
  };

  React.useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: "AUDIO_SYNTH",
      renderingMode: "web_audio",
      ready: true,
      padsLoaded: soundPads.length,
      padsTriggered,
      ambientVolume: ambientVol,
      reverbDepth,
    };
  }, [padsTriggered, ambientVol, reverbDepth]);

  return (
    <div
      data-workspace="tactile_audio_console"
      data-experience-capability="AUDIO_SYNTH"
      data-aegis-experience="AUDIO_SYNTH"
      className="audio-experience-container"
      style={{
        minHeight: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          background: "${theme.surface}",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid ${theme.border}",
          padding: "0.875rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            fontSize: "1.125rem",
            color: "${theme.accent}",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✦</span> ${brandName}
        </Link>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "${theme.textMuted}" }}>
          ${headerSubtitle}
        </span>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, color: "${theme.text}", margin: "0 0 0.5rem" }}>
            ${headerTitle}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "${theme.textMuted}", maxWidth: "560px", margin: "0 auto" }}>
            ${headerDescription}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {soundPads.map(pad => {
            const isPlaying = activePad === pad.id;
            return (
              <div
                key={pad.id}
                onClick={() => playTone(pad)}
                style={{
                  background: isPlaying ? "${theme.accent}26" : "rgba(255,255,255,0.04)",
                  border: "2px solid " + (isPlaying ? pad.color : "${theme.border}"),
                  borderRadius: "1.25rem",
                  padding: "1.75rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: isPlaying ? "scale(0.97)" : "scale(1)",
                  boxShadow: isPlaying ? "0 0 30px " + pad.color + "44" : "none",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2.5rem" }}>{pad.icon}</span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: pad.color,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                      background: pad.color + "22",
                    }}
                  >
                    {pad.freq} Hz
                  </span>
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "${theme.text}", margin: "0 0 0.35rem" }}>{pad.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "${theme.textMuted}", margin: 0, lineHeight: 1.5 }}>{pad.desc}</p>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: "${theme.surface}",
            border: "1px solid ${theme.border}",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "${theme.text}" }}>Master Resonance Gain</span>
              <span style={{ fontSize: "0.75rem", color: "${theme.accent}" }}>{ambientVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ambientVol}
              onChange={e => setAmbientVol(Number(e.target.value))}
              style={{ width: "100%", accentColor: "${theme.accent}" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "${theme.text}" }}>Reverb Decay Envelope</span>
              <span style={{ fontSize: "0.75rem", color: "${theme.accent}" }}>{reverbDepth}ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={reverbDepth}
              onChange={e => setReverbDepth(Number(e.target.value))}
              style={{ width: "100%", accentColor: "${theme.accent}" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ${componentName};
`;
  }

  private static derivePads(promptLower: string, seed: number): SoundPad[] {
    const isOcean = /\b(underwater|marine|submersible|abyss|benthic|bathymetric|deep-sea|hadal trench|hydrophone)\b/i.test(promptLower);
    const isMuseum = /\b(museum|art|gallery|exhibition|curator|artwork|cultural|heritage|sculpture)\b/i.test(promptLower);
    const isFantasy = /\b(fantasy|claymation|kazzoo|magic|whimsical)\b/i.test(promptLower);
    const isChildrenMusic = /\b(children|kids|rhythm|melody|toy instrument)\b/i.test(promptLower);

    if (isOcean) {
      return [
        { id: "sonar", name: "High-Freq Sonar Ping", icon: "📡", freq: 1200, wave: "sine", color: "#00f0ff", desc: "Acoustic bathymetric depth sounder echo" },
        { id: "hydro", name: "Deep Hydrophone Hum", icon: "🌊", freq: 82.41, wave: "triangle", color: "#38bdf8", desc: "Sub-surface tectonic pressure resonance" },
        { id: "whale", name: "Pelagic Leviathan Call", icon: "🐋", freq: 220, wave: "sine", color: "#818cf8", desc: "Low-frequency communication across 100 nautical miles" },
        { id: "vent", name: "Thermal Vent Rumble", icon: "🌋", freq: 110, wave: "square", color: "#fbbf24", desc: "Superheated mineral expulsion from hydrothermal chimneys" },
        { id: "chime", name: "Bioluminescent Shimmer", icon: "✨", freq: 784, wave: "sine", color: "#34d399", desc: "High-order harmonic chime from siphonophore photophores" },
        { id: "trench", name: "Hadal Pressure Echo", icon: "🛡️", freq: 146.83, wave: "triangle", color: "#f472b6", desc: "Deepest benthic reverberation from 11,000 meters" },
      ];
    }

    if (isMuseum) {
      return [
        { id: "curator1", name: "Curator Introduction", icon: "🏛️", freq: 440, wave: "sine", color: "#e2e8f0", desc: "Curatorial overview of spatial form, light, and exhibition thesis" },
        { id: "curator2", name: "Artist Voice: The Monolith", icon: "🎨", freq: 329.63, wave: "triangle", color: "#cbd5e1", desc: "Primary artist audio commentary on material absence and shadow" },
        { id: "room1", name: "Gallery 01: North Atrium", icon: "🧭", freq: 523.25, wave: "sine", color: "#94a3b8", desc: "Acoustic spatial guide for monumental sculpture works" },
        { id: "room2", name: "Gallery 02: Light & Void", icon: "✨", freq: 659.25, wave: "triangle", color: "#f8fafc", desc: "Curator commentary on architectural lighting and whitespace" },
        { id: "room3", name: "Gallery 03: Tactile Bronze", icon: "🗿", freq: 220, wave: "sine", color: "#64748b", desc: "Artist process notes on lost-wax casting and hand patination" },
        { id: "outro", name: "Exhibition Walkthrough Outro", icon: "🎧", freq: 587.33, wave: "sine", color: "#cbd5e1", desc: "Concluding curatorial remarks and archival reference bibliography" },
      ];
    }

    if (isFantasy) {
      return [
        { id: "chime", name: "Stardust Chime", icon: "✨", freq: 880, wave: "sine", color: "#f9c74f", desc: "Pure high octave celestial resonance" },
        { id: "flute", name: "Misty Flute", icon: "🪈", freq: 523.25, wave: "triangle", color: "#5b8dee", desc: "Soothing wind instrument tone from Cloud Spire" },
        { id: "moss", name: "Moss Drum", icon: "🥁", freq: 164.81, wave: "square", color: "#10b981", desc: "Deep organic percussive heartbeat" },
        { id: "bell", name: "Cloud Bell", icon: "🔔", freq: 659.25, wave: "sine", color: "#9b59b6", desc: "Harmonic overtones echoing across archipelago" },
        { id: "acorn", name: "Acorn Pop", icon: "🌰", freq: 440, wave: "triangle", color: "#e67e22", desc: "Crisp tactile snap from foraging expeditions" },
        { id: "whisper", name: "Whisper Breeze", icon: "🍃", freq: 329.63, wave: "sine", color: "#1abc9c", desc: "Gentle ambient rustle through pastel foliage" },
      ];
    }

    if (isChildrenMusic) {
      return [
        { id: "xylo", name: "Sunlight Xylophone", icon: "🪵", freq: 587.33, wave: "sine", color: "#f59e0b", desc: "Crisp wooden bar chime with vibrant bounce" },
        { id: "glock", name: "Rainbow Glockenspiel", icon: "🔔", freq: 1046.5, wave: "triangle", color: "#ec4899", desc: "Sparkling high metallic bell overtones" },
        { id: "bass", name: "Bubble Bass", icon: "🫧", freq: 130.81, wave: "square", color: "#3b82f6", desc: "Plucky rounded acoustic bass note" },
        { id: "horn", name: "Playful Brass Horn", icon: "🎺", freq: 349.23, wave: "sawtooth", color: "#eab308", desc: "Joyful celebratory trumpet flourish" },
        { id: "clap", name: "Rhythm Woodblock", icon: "👏", freq: 440, wave: "triangle", color: "#10b981", desc: "Crisp syncopated percussion clap" },
        { id: "harp", name: "Fairy Harp Gliss", icon: "🪕", freq: 659.25, wave: "sine", color: "#8b5cf6", desc: "Cascading ethereal plucked strings" },
      ];
    }

    // Default Generalized Acoustic Pads
    return [
      { id: "tone1", name: "Harmonic Ingress", icon: "✦", freq: 440, wave: "sine", color: "#3b82f6", desc: "Concert A baseline reference frequency" },
      { id: "tone2", name: "Sub-Octave Resonance", icon: "◈", freq: 110, wave: "triangle", color: "#6366f1", desc: "Warm foundational bass drone" },
      { id: "tone3", name: "Meridian Bell", icon: "▲", freq: 659.25, wave: "sine", color: "#8b5cf6", desc: "Crisp upper-register bell tone" },
      { id: "tone4", name: "Tactile Pulse", icon: "◼", freq: 220, wave: "square", color: "#ec4899", desc: "Organic square-wave percussive pulse" },
      { id: "tone5", name: "Atmospheric Flute", icon: "●", freq: 523.25, wave: "triangle", color: "#10b981", desc: "Smooth mid-range wind harmonic" },
      { id: "tone6", name: "High Horizon Chime", icon: "✨", freq: 880, wave: "sine", color: "#f59e0b", desc: "High harmonic shimmer overtone" },
    ];
  }

  private static deriveTheme(promptLower: string): { bg: string; surface: string; border: string; accent: string; text: string; textMuted: string } {
    if (/\b(underwater|marine|submersible|abyss|benthic|bathymetric|deep-sea|hadal trench|hydrophone)\b/i.test(promptLower)) {
      return {
        bg: "linear-gradient(160deg,#020712 0%,#041427 50%,#01050d 100%)",
        surface: "rgba(4,20,39,0.9)",
        border: "rgba(0,240,255,0.18)",
        accent: "#00f0ff",
        text: "#e2f1f8",
        textMuted: "#6ba2bf",
      };
    }
    if (/\b(museum|art|gallery|exhibition|curator|artwork|cultural|heritage|sculpture)\b/i.test(promptLower)) {
      return {
        bg: "linear-gradient(160deg,#0a0a0a 0%,#141414 50%,#050505 100%)",
        surface: "rgba(20,20,20,0.9)",
        border: "rgba(255,255,255,0.12)",
        accent: "#f5f5f5",
        text: "#fafafa",
        textMuted: "#a3a3a3",
      };
    }
    if (/\b(fantasy|claymation|kazzoo|magic|whimsical)\b/i.test(promptLower)) {
      return {
        bg: "linear-gradient(160deg,#0e101f 0%,#15182e 50%,#0d0f1c 100%)",
        surface: "rgba(14,16,31,0.9)",
        border: "rgba(249,199,79,0.18)",
        accent: "#f9c74f",
        text: "#f0e6d3",
        textMuted: "rgba(212,180,131,0.7)",
      };
    }
    return {
      bg: "linear-gradient(160deg,#0a0d18 0%,#131a2e 50%,#080a14 100%)",
      surface: "rgba(19,26,46,0.9)",
      border: "rgba(59,130,246,0.2)",
      accent: "#3b82f6",
      text: "#f8fafc",
      textMuted: "#94a3b8",
    };
  }
}
