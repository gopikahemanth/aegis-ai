/**
 * CharacterExperienceGenerator
 *
 * Generic experience-capability generator for character spotlights, specimen inspection plinths,
 * companion turntables, and entity roster explorers.
 *
 * Parametric & domain-agnostic: instantiated purely from active product semantics,
 * page experience plan, theme colors, and generation seed.
 */

export interface DomainEntity {
  id: string;
  name: string;
  emoji: string;
  role: string;
  badge: string;
  bio: string;
  dialogue: string[];
  freq: number;
}

export interface CharacterExperienceGeneratorOptions {
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

export class CharacterExperienceGenerator {
  public static generate(options: CharacterExperienceGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42 } = options;
    const promptLower = prompt.toLowerCase();

    const entities = this.deriveEntities(promptLower, seed);
    const theme = options.theme || this.deriveTheme(promptLower);

    return `import React from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const companions = ${JSON.stringify(entities, null, 4)};

  const [selectedCharacter, setSelectedCharacter] = React.useState(companions[0]?.id || "muffy");
  const activeId = selectedCharacter;
  const setActiveId = setSelectedCharacter;

  const [dialogueIdx, setDialogueIdx] = React.useState(0);
  const [expression, setExpression] = React.useState("idle");
  const [clipActive, setClipActive] = React.useState(false);

  const activeCompanion = companions.find(c => c.id === activeId) || companions[0];

  const playVoiceClip = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(activeCompanion.freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}

    setExpression("speaking");
    setClipActive(true);
    setTimeout(() => {
      setExpression("idle");
      setClipActive(false);
    }, 1200);
  };

  const advanceDialogue = () => {
    setDialogueIdx(i => (i + 1) % activeCompanion.dialogue.length);
    setExpression("speaking");
    setTimeout(() => setExpression("idle"), 600);
  };

  React.useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: "CHARACTER_STAGE",
      renderingMode: "interactive_spotlight",
      ready: true,
      companionsLoaded: companions.length,
      activeCompanion: activeId,
      voicePlaybackActive: clipActive,
    };
  }, [activeId, clipActive, companions.length]);

  return (
    <div
      data-workspace="character_stage"
      data-experience-capability="CHARACTER_STAGE"
      data-aegis-experience="CHARACTER_STAGE"
      className="character-stage companion-plinth avatar-stage"
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
          zIndex: 20,
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            fontSize: "1.125rem",
            color: "${theme.accent}",
            textDecoration: "none",
          }}
        >
          ✦ ${brandName}
        </Link>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "${theme.textMuted}" }}>
          Inspection Plinth & Voice Stage
        </span>
      </header>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <div
            className="avatar-stage avatar-turntable"
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, ${theme.accent}2e, rgba(0,0,0,0.5))",
              border: "3px solid ${theme.accent}66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "6.5rem",
              boxShadow: "0 0 50px ${theme.accent}22",
              transition: "transform 0.4s ease",
              transform: expression === "speaking" ? "scale(1.08) rotate(3deg)" : "scale(1)",
            }}
          >
            {activeCompanion.emoji}
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 800, color: "${theme.accent}", margin: "0 0 0.25rem" }}>
              {activeCompanion.name}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "${theme.textMuted}", fontStyle: "italic", margin: 0 }}>
              "{activeCompanion.role}"
            </p>
          </div>

          <div
            style={{
              background: "${theme.surface}",
              border: "1px solid ${theme.border}",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              textAlign: "center",
              width: "100%",
              maxWidth: "340px",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "${theme.text}", lineHeight: 1.7, margin: "0 0 1rem" }}>
              {activeCompanion.bio}
            </p>
            <span style={{ fontSize: "0.75rem", color: "${theme.textMuted}" }}>
              Classification: <strong style={{ color: "${theme.accent}" }}>{activeCompanion.badge}</strong>
            </span>
          </div>

          <button
            onClick={playVoiceClip}
            style={{
              padding: "0.875rem 2rem",
              borderRadius: "9999px",
              background: clipActive ? "#10b981" : "linear-gradient(135deg, ${theme.accent}, #d97706)",
              color: "#0b121c",
              fontWeight: 800,
              fontSize: "0.9375rem",
              border: "none",
              cursor: "pointer",
              width: "100%",
              maxWidth: "340px",
              transition: "all 0.2s",
            }}
          >
            {clipActive ? "🔊 Emitting Acoustic Signal..." : "🔊 Play Voice / Audio Clip"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "${theme.textMuted}", display: "block", marginBottom: "0.75rem" }}>
              Available Roster
            </span>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {companions.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setDialogueIdx(0);
                    setExpression("idle");
                  }}
                  style={{
                    padding: "0.625rem 1.125rem",
                    borderRadius: "9999px",
                    border: "2px solid " + (activeId === c.id ? "${theme.accent}" : "${theme.border}"),
                    background: activeId === c.id ? "${theme.accent}1f" : "transparent",
                    color: activeId === c.id ? "${theme.accent}" : "${theme.textMuted}",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "${theme.surface}",
              border: "1px solid ${theme.border}",
              borderRadius: "1.5rem",
              padding: "1.75rem",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "${theme.accent}", display: "block", marginBottom: "0.75rem" }}>
              Dialogue & Observations
            </span>
            <p style={{ fontSize: "1.125rem", lineHeight: 1.75, color: "${theme.text}", marginBottom: "1.5rem", fontStyle: "italic" }}>
              "{activeCompanion.dialogue[dialogueIdx]}"
            </p>
            <button
              onClick={advanceDialogue}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                background: "${theme.accent}1f",
                border: "1px solid ${theme.accent}4d",
                color: "${theme.accent}",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.8125rem",
              }}
            >
              Continue Observation → ({dialogueIdx + 1}/{activeCompanion.dialogue.length})
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ${componentName};
`;
  }

  private static deriveEntities(promptLower: string, seed: number): DomainEntity[] {
    const isOcean = /underwater|ocean|marine|sea|submersible|deep|trench|abyss/i.test(promptLower);
    const isFantasy = /fantasy|claymation|kazzoo|magic|whimsical/i.test(promptLower);
    const isCraft = /furniture|wood|timber|joinery|atelier|craft|architecture/i.test(promptLower);

    if (isOcean) {
      return [
        { id: "nautilus", name: "Nautilus Prime", emoji: "🐚", role: "Pelagic Cephalopod", badge: "Bathypelagic Living Fossil", bio: "Spiraled aragonite shell navigating 500m depths using proportional water-jet propulsion.", dialogue: ["Camera array reveals bioluminescent siphonophores schooling along the ridge. 🌊", "Hydrostatic seal holds stable at 45 atmospheres. 🛰️", "Ancient nautiloids have charted these deep trenches for 500 million years. 📜"], freq: 330 },
        { id: "viper", name: "Viperfish Abyssus", emoji: "🐟", role: "Bathypelagic Predator", badge: "Abyssal Carnivore", bio: "Hinged jaws and photophore lures emitting rhythmic blue-green bioluminescent flashes.", dialogue: ["Flashing photophore array primed for prey capture in pitch-dark. ✨", "Teeth so long they rest outside the closed skull. 🦈", "Detecting distant hydrothermal vent vibrations. 🌋"], freq: 440 },
        { id: "isopod", name: "Giant Bathynomus", emoji: "🦞", role: "Benthic Armored Scavenger", badge: "Hadal Floor Specialist", bio: "Segmented chitinous carapace surviving under 300 atmospheres of benthic pressure.", dialogue: ["Deep sea snow deposits settling across benthic sediment. ❄️", "Slow metabolic rate allows year-long endurance between food falls. ⏳", "Carapace telemetry calibrated for extreme hydrostatic compression. 🛡️"], freq: 220 },
        { id: "vampire", name: "Vampyroteuthis", emoji: "🦑", role: "Mesopelagic Cephalopod", badge: "Oxygen Minimum Survivor", bio: "Webbed cloak of tentacles with luminescent organs glowing softly in oxygen-poor depths.", dialogue: ["Mantle pulses cold azure bioluminescence through the void. 💙", "Retractable sensory filaments detect micro-currents. 🍃", "Thriving comfortably inside the oceanic oxygen-minimum zone. 🌌"], freq: 550 },
      ];
    }

    if (isFantasy) {
      return [
        { id: "muffy", name: "Muffy", emoji: "🧸", role: "Bubbly & Warm", badge: "Pastel Cloud Forager", bio: "Muffy floats between the Pastel Mushroom Circle and the Whispering Fern, collecting lost melodies.", dialogue: ["Hello, wanderer! Have you seen my cloud macaroon? 🌸", "The Archipelago is singing today! Can you hear it? 🎵", "Every island holds a secret if you listen closely! ✨"], freq: 660 },
        { id: "rony", name: "Rony", emoji: "🦔", role: "Curious & Studious", badge: "Archival Lore Keeper", bio: "Rony archives everything he discovers in his ever-growing lore scroll.", dialogue: ["Fascinating! This rock suggests ancient tectonic drift! 📜", "I catalogued 4,721 cloud formations. Only 3 more to go. ☁️", "The Bridge of Tortoise hums at 432 Hz at dawn. 🌅"], freq: 440 },
        { id: "pip", name: "Pip", emoji: "🐢", role: "Gentle & Wise", badge: "Ancient Bridge Guard", bio: "Pip moves slowly but sees everything. The eldest resident of the floating archipelago.", dialogue: ["Patience, young explorer. The islands reveal in their own time. 🌿", "Misty berry jam today. Would you like some? 🍓", "I have crossed the Bridge of Tortoise 847 times. Each crossing is new. 🌉"], freq: 330 },
        { id: "bramblebark", name: "Bramblebark", emoji: "🌲", role: "Gruff & Protective", badge: "Spire Guardian", bio: "Bramblebark guards the Cloud Spire and tends the mushroom fields by night.", dialogue: ["Halt! State your quest before you pass. 🛡️", "The mushroom fields are not for wandering at night.", "Hmph. You have heart. You may pass. 🌟"], freq: 220 },
      ];
    }

    if (isCraft) {
      return [
        { id: "lounge", name: "Master Recline Armchair", emoji: "🪑", role: "Ergonomic Sanctuary", badge: "Bent Walnut & Leather", bio: "Seven-ply molded hardwood shell calibrated to perpetual 15-degree recline angle.", dialogue: ["Compound curvature distributes thoracic weight effortlessly.", "Natural oil finish develops deeper honey patina over decades.", "Pirelli rubber webbing absorbs dynamic sit-down impact."], freq: 220 },
        { id: "dining", name: "Wishbone Pavilion Chair", emoji: "🪵", role: "Dining Sculptural Form", badge: "Steam-Bent Ash", bio: "Continuous circular steam-bent crest rail joined seamlessly to hand-woven cord seat.", dialogue: ["120 meters of natural unbleached paper cord hand-woven into seat.", "Curved y-shaped back spline cradles lumbar spine naturally.", "Weighs only 4.5 kilograms yet supports over 200."], freq: 330 },
        { id: "table", name: "Noguchi Sculptural Centerpiece", emoji: "☕", role: "Biomorphic Coffee Table", badge: "Solid Walnut & 19mm Glass", bio: "Two identical organically curved wood bases pivoting on single steel dowel pin.", dialogue: ["Pure biomorphic balance — no nails or visible fasteners.", "Heavy plate glass allows wood sculpture to be enjoyed from every angle.", "A harmonious intersection of fine sculpture and utilitarian furniture."], freq: 440 },
        { id: "desk", name: "Architect Cantilever Desk", emoji: "📐", role: "Tectonic Workstation", badge: "Smoked Oak & Brushed Brass", bio: "Floating desktop cantilevered over precision bronze frame with integrated cord channels.", dialogue: ["Full-depth solid oak drawer boxes with blind dovetail joinery.", "Concealed magnetic cable management through bronze leg channel.", "Micro-beveled perimeter edge ensures wrist comfort during prolonged drafting."], freq: 550 },
      ];
    }

    // Default Generalized Entities
    return [
      { id: "entity1", name: "Alpha Coordinate Guide", emoji: "✦", role: "Primary Navigator", badge: "Core System Specialist", bio: "Oversees primary quadrant exploration and sensor synchronization.", dialogue: ["System parameters are optimal for continued observation. 🌐", "Logging new landmark discoveries into the central registry. 📝", "Ready to initiate next operational phase when commanded. ⚡"], freq: 440 },
      { id: "entity2", name: "Curatorial Specialist", emoji: "◈", role: "Domain Analyst", badge: "Research Fellow", bio: "Continuously tracks domain patterns, literature references, and archival evidence.", dialogue: ["Ambient evidence aligns with primary conceptual tenets. 📊", "Reference archives verified across catalogued volumes. 📚", "Annotated catalogue synchronized with verified provenance. 💾"], freq: 520 },
      { id: "entity3", name: "Meridian Courier", emoji: "▲", role: "Expedition Pioneer", badge: "Field Specialist", bio: "Pioneers transit corridors between core hub and exterior territories.", dialogue: ["Path forward is clear and beacon markers are positioned. 🧭", "Terrain density allows swift transit between sectors. ⛰️", "Discovered alternate transit route through sector ridge. 🗺️"], freq: 330 },
      { id: "entity4", name: "Archival Custodian", emoji: "◼", role: "Knowledge Keeper", badge: "Senior Chronicler", bio: "Safeguards foundational records and certifies operational milestones.", dialogue: ["Historical logs preserved in permanent immutable storage. 📜", "Every discovery contributes to our collective understanding. 🏛️", "Milestone certificate authenticated and sealed. 🏆"], freq: 260 },
    ];
  }

  private static deriveTheme(promptLower: string): { bg: string; surface: string; border: string; accent: string; text: string; textMuted: string } {
    if (/underwater|ocean|marine|sea|submersible|deep|trench/i.test(promptLower)) {
      return {
        bg: "linear-gradient(160deg,#030b17 0%,#061a2f 50%,#020811 100%)",
        surface: "rgba(6,26,47,0.85)",
        border: "rgba(0,240,255,0.2)",
        accent: "#00f0ff",
        text: "#e2f1f8",
        textMuted: "#6ba2bf",
      };
    }
    if (/fantasy|claymation|kazzoo|magic|whimsical/i.test(promptLower)) {
      return {
        bg: "linear-gradient(160deg,#0d1f2d 0%,#1a0e2e 50%,#0d1f2d 100%)",
        surface: "rgba(13,31,45,0.85)",
        border: "rgba(212,180,131,0.2)",
        accent: "#f9c74f",
        text: "#f0e6d3",
        textMuted: "rgba(212,180,131,0.7)",
      };
    }
    return {
      bg: "linear-gradient(160deg,#090d16 0%,#111827 50%,#070a10 100%)",
      surface: "rgba(17,24,39,0.85)",
      border: "rgba(59,130,246,0.2)",
      accent: "#3b82f6",
      text: "#f9fafb",
      textMuted: "#9ca3af",
    };
  }
}
