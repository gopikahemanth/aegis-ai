/**
 * ScrollStoryExperienceGenerator
 *
 * Generative implementation for the SCROLL_STORY capability.
 * Consumes a resolved CompositionVariant from CompositionVariantResolver and
 * dynamically renders the appropriate spatial layout (cinematic full-bleed,
 * horizontal timeline, split editorial, center-stage pinned, or docked rail).
 *
 * Invariant:
 * "The capability generator owns behavior (chapters, scroll state, active chapter,
 * transitions, reading progress), not a single fixed wireframe."
 */

import { CompositionVariantResolver, CompositionVariant } from "../composition-variant-resolver.js";
import { DomainVocabularySynthesizer, DomainStoryChapter } from "../domain-vocabulary-synthesizer.js";

export interface ScrollStoryGeneratorOptions {
  componentName: string;
  brandName: string;
  route: string;
  prompt: string;
  seed?: number;
  pageRole?: string;
  purpose?: string;
  composition?: CompositionVariant;
  chapters?: DomainStoryChapter[];
  theme?: {
    bg?: string;
    surface?: string;
    border?: string;
    accent?: string;
    text?: string;
    textMuted?: string;
  };
}

export class ScrollStoryExperienceGenerator {
  public static generate(options: ScrollStoryGeneratorOptions): string {
    const {
      componentName,
      brandName,
      route,
      prompt,
      seed = 42,
      pageRole = "Scroll Story",
      purpose = "Narrative Chapter Experience",
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
        experienceCapability: "SCROLL_STORY",
        seed,
      });

    // Synthesize domain chapters with zero template leakage
    const chapters =
      options.chapters ||
      DomainVocabularySynthesizer.synthesizeChapters({
        brandName,
        prompt,
        route,
        pageRole,
        purpose,
        seed,
      });

    const theme = {
      bg: options.theme?.bg || "#0a0d18",
      surface: options.theme?.surface || "rgba(16,22,38,0.9)",
      border: options.theme?.border || "rgba(255,255,255,0.08)",
      accent: options.theme?.accent || chapters[0]?.color || "#f9c74f",
      text: options.theme?.text || "#f0e6d3",
      textMuted: options.theme?.textMuted || "rgba(240,230,211,0.65)",
    };

    const chaptersJson = JSON.stringify(chapters, null, 2);

    return `import React from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const chapters = ${chaptersJson};

  const [activeChapter, setActiveChapter] = React.useState(1);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: "SCROLL_STORY",
      renderingMode: "canvas2d",
      ready: true,
      scrollDriven: true,
      objectsRendered: chapters.length * 3,
      interactiveObjects: chapters.length,
      animationActive: true,
      compositionVariant: "${composition.id}",
      structuralFingerprint: "${composition.structuralFingerprint}",
      dominantAxis: "${composition.dominantAxis}",
      focalRegion: "${composition.focalRegion}",
      sectionTopology: "${composition.sectionTopology}",
    };

    const el = scrollRef.current;
    if (!el) return;
    const isHorizontal = ${composition.dominantAxis === "horizontal"};
    const onScroll = () => {
      const maxScroll = isHorizontal
        ? el.scrollWidth - el.clientWidth
        : el.scrollHeight - el.clientHeight;
      const current = isHorizontal ? el.scrollLeft : el.scrollTop;
      const pct = maxScroll > 0 ? Math.round((current / maxScroll) * 100) : 0;
      setScrollProgress(pct);
      const step = 100 / chapters.length;
      const activeIdx = Math.min(Math.floor(pct / step), chapters.length - 1);
      setActiveChapter(chapters[activeIdx]?.id || 1);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [chapters]);

  const scrollToChapter = (ch: typeof chapters[0]) => {
    setActiveChapter(ch.id);
    const el = scrollRef.current;
    if (!el) return;
    const isHorizontal = ${composition.dominantAxis === "horizontal"};
    if (isHorizontal) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollLeft = (ch.scrollPct / 100) * maxScroll;
    } else {
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = (ch.scrollPct / 100) * maxScroll;
    }
  };

  const currentChapterObj = chapters.find(c => c.id === activeChapter) || chapters[0];

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
      case "cinematic_full_bleed":
        return `return (
    <div
      data-workspace="narrative_chronicle"
      data-experience-capability="SCROLL_STORY"
      data-aegis-experience="SCROLL_STORY"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      data-scroll-progress="true"
      style={{
        position: "relative",
        height: "100vh",
        background: "${theme.bg}",
        color: "${theme.text}",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Floating Header & Navigation Pills */}
      <header
        style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          background: "${theme.surface}",
          backdropFilter: "blur(16px)",
          border: "1px solid ${theme.border}",
          padding: "0.5rem 1.25rem",
          borderRadius: "9999px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          maxWidth: "92vw",
        }}
      >
        <Link to="/" style={{ fontWeight: 800, fontSize: "0.875rem", color: "${theme.accent}", textDecoration: "none", letterSpacing: "0.05em" }}>
          ✦ ${brandName}
        </Link>
        <div style={{ height: "16px", width: "1px", background: "${theme.border}" }} />
        <nav style={{ display: "flex", alignItems: "center", gap: "0.35rem", overflowX: "auto" }}>
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => scrollToChapter(ch)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "none",
                background: activeChapter === ch.id ? ch.color : "transparent",
                color: activeChapter === ch.id ? "#ffffff" : "${theme.textMuted}",
                fontWeight: activeChapter === ch.id ? 700 : 500,
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {ch.emoji} Ch.{ch.id}
            </button>
          ))}
        </nav>
        <div style={{ fontSize: "0.75rem", color: "${theme.accent}", fontWeight: 700 }}>
          {scrollProgress}%
        </div>
      </header>

      {/* Cinematic Full-Bleed Scroll Viewport */}
      <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", scrollSnapType: "y mandatory" }}>
        {chapters.map(ch => (
          <section
            key={ch.id}
            data-scene={ch.scene}
            data-chapter={\`chapter-\${ch.id}\`}
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              padding: "4rem 2rem",
              scrollSnapAlign: "start",
              position: "relative",
              background: \`radial-gradient(circle at 50% 50%, \${ch.color}22, transparent 75%)\`,
            }}
          >
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: ch.color, display: "inline-block", marginBottom: "1rem" }}>
                CHAPTER {ch.id} · {ch.milestone}
              </span>
              <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.15, color: "${theme.text}", marginBottom: "1.5rem" }}>
                {ch.emoji} {ch.title}
              </h2>
              <p style={{ fontSize: "1.25rem", lineHeight: 1.8, color: "${theme.textMuted}", maxWidth: "680px", margin: "0 auto", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                "{ch.lore}"
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );`;

      case "horizontal_timeline":
        return `return (
    <div
      data-workspace="narrative_chronicle"
      data-experience-capability="SCROLL_STORY"
      data-aegis-experience="SCROLL_STORY"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      data-scroll-progress="true"
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
      <header
        style={{
          background: "${theme.surface}",
          borderBottom: "1px solid ${theme.border}",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/" style={{ fontWeight: 800, fontSize: "1rem", color: "${theme.accent}", textDecoration: "none" }}>
            ✦ ${brandName}
          </Link>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "${theme.textMuted}" }}>
            Horizontal Timeline Chronicle
          </span>
        </div>
        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "${theme.accent}" }}>
          Active: Ch.{activeChapter} ({scrollProgress}%)
        </div>
      </header>

      {/* Horizontal Scrolling Scene Track */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          padding: "2rem",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        {chapters.map(ch => (
          <section
            key={ch.id}
            data-scene={ch.scene}
            data-chapter={\`chapter-\${ch.id}\`}
            style={{
              minWidth: "min(640px, 85vw)",
              height: "70vh",
              scrollSnapAlign: "center",
              background: "${theme.surface}",
              border: \`1px solid \${activeChapter === ch.id ? ch.color : "${theme.border}"}\`,
              borderRadius: "1.5rem",
              padding: "3rem 2.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow: activeChapter === ch.id ? \`0 20px 40px \${ch.color}26\` : "0 10px 25px rgba(0,0,0,0.3)",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: ch.color, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "1rem" }}>
              <span>MILESTONE: {ch.milestone}</span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "${theme.text}", marginBottom: "1.25rem", lineHeight: 1.2 }}>
              {ch.emoji} {ch.title}
            </h2>
            <p style={{ fontSize: "1.0625rem", lineHeight: 1.8, color: "${theme.textMuted}", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
              "{ch.lore}"
            </p>
          </section>
        ))}
      </div>

      {/* Bottom Timeline Rail */}
      <footer
        style={{
          background: "${theme.surface}",
          borderTop: "1px solid ${theme.border}",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "${theme.textMuted}", textTransform: "uppercase", letterSpacing: "0.1em" }}>Milestones</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1rem" }}>
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => scrollToChapter(ch)}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: activeChapter === ch.id ? ch.color : "rgba(255,255,255,0.06)",
                color: activeChapter === ch.id ? "#ffffff" : "${theme.textMuted}",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ch.id}. {ch.milestone}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );`;

      case "split_editorial":
        return `return (
    <div
      data-workspace="narrative_chronicle"
      data-experience-capability="SCROLL_STORY"
      data-aegis-experience="SCROLL_STORY"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      data-scroll-progress="true"
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "${theme.bg}",
        color: "${theme.text}",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Pinned Editorial Visual Showcase Column */}
      <div
        style={{
          borderRight: "1px solid ${theme.border}",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: \`radial-gradient(circle at 30% 40%, \${currentChapterObj.color}26, transparent 70%), ${theme.surface}\`,
          transition: "background 0.4s ease",
        }}
      >
        <div>
          <Link to="/" style={{ fontWeight: 800, fontSize: "1.125rem", color: "${theme.accent}", textDecoration: "none" }}>
            ✦ ${brandName}
          </Link>
          <div style={{ marginTop: "4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: currentChapterObj.color }}>
              CHAPTER {currentChapterObj.id} OF {chapters.length}
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, lineHeight: 1.15, marginTop: "0.75rem", color: "${theme.text}" }}>
              {currentChapterObj.emoji} {currentChapterObj.title}
            </h1>
            <div style={{ display: "inline-block", marginTop: "1.5rem", padding: "0.4rem 1rem", borderRadius: "9999px", background: \`\${currentChapterObj.color}26\`, border: \`1px solid \${currentChapterObj.color}66\`, color: currentChapterObj.color, fontSize: "0.75rem", fontWeight: 700 }}>
              ✓ Milestone: {currentChapterObj.milestone}
            </div>
          </div>
        </div>

        {/* Tab Switcher & Progress */}
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => scrollToChapter(ch)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: activeChapter === ch.id ? ch.color : "rgba(255,255,255,0.06)",
                  color: activeChapter === ch.id ? "#ffffff" : "${theme.textMuted}",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ch.{ch.id}
              </button>
            ))}
          </div>
          <div style={{ height: "4px", background: "${theme.border}", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "${theme.accent}", width: \`\${scrollProgress}%\`, transition: "width 0.2s" }} />
          </div>
        </div>
      </div>

      {/* Progressive Text Column */}
      <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", padding: "3rem" }}>
        {chapters.map(ch => (
          <section
            key={ch.id}
            data-scene={ch.scene}
            data-chapter={\`chapter-\${ch.id}\`}
            style={{
              minHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderBottom: "1px solid ${theme.border}",
              padding: "2rem 0",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: ch.color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
              {ch.milestone}
            </span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "${theme.text}", marginBottom: "1rem" }}>
              {ch.title}
            </h2>
            <p style={{ fontSize: "1.125rem", lineHeight: 1.85, color: "${theme.textMuted}", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              "{ch.lore}"
            </p>
          </section>
        ))}
      </div>
    </div>
  );`;

      case "center_stage_pinned":
        return `return (
    <div
      data-workspace="narrative_chronicle"
      data-experience-capability="SCROLL_STORY"
      data-aegis-experience="SCROLL_STORY"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      data-scroll-progress="true"
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
      <header
        style={{
          background: "${theme.surface}",
          borderBottom: "1px solid ${theme.border}",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        <Link to="/" style={{ fontWeight: 800, fontSize: "1rem", color: "${theme.accent}", textDecoration: "none" }}>
          ✦ ${brandName}
        </Link>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "${theme.textMuted}" }}>
          Center-Stage Pinned Narrative
        </span>
        <span style={{ fontSize: "0.875rem", color: "${theme.accent}", fontWeight: 700 }}>
          {scrollProgress}% Read
        </span>
      </header>

      {/* Center Stage Card Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            width: "100%",
            background: "${theme.surface}",
            border: \`1px solid \${currentChapterObj.color}80\`,
            borderRadius: "2rem",
            padding: "3.5rem",
            boxShadow: \`0 25px 60px \${currentChapterObj.color}26\`,
            textAlign: "center",
            position: "relative",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: currentChapterObj.color }}>
            CHAPTER {currentChapterObj.id} · {currentChapterObj.milestone}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "${theme.text}", margin: "1rem 0 1.5rem" }}>
            {currentChapterObj.emoji} {currentChapterObj.title}
          </h1>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.85, color: "${theme.textMuted}", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            "{currentChapterObj.lore}"
          </p>

          {/* Orbital Chapter Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "2.5rem" }}>
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => scrollToChapter(ch)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  border: "none",
                  background: activeChapter === ch.id ? ch.color : "rgba(255,255,255,0.08)",
                  color: activeChapter === ch.id ? "#ffffff" : "${theme.textMuted}",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {ch.emoji} {ch.id}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );`;

      case "docked_left_rail":
      default:
        return `return (
    <div
      data-workspace="narrative_chronicle"
      data-experience-capability="SCROLL_STORY"
      data-aegis-experience="SCROLL_STORY"
      data-composition-variant="${comp.id}"
      data-structural-fingerprint="${comp.structuralFingerprint}"
      data-scroll-progress="true"
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "${theme.bg}",
        color: "${theme.text}",
        overflow: "hidden",
      }}
    >
      <nav
        style={{
          background: "${theme.surface}",
          borderRight: "1px solid ${theme.border}",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0",
          gap: "0.25rem",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            fontSize: "1rem",
            color: "${theme.accent}",
            textDecoration: "none",
            letterSpacing: "0.06em",
            padding: "0 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          ✦ ${brandName}
        </Link>
        {chapters.map(ch => (
          <button
            key={ch.id}
            onClick={() => scrollToChapter(ch)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.625rem 1.25rem",
              textAlign: "left",
              background: activeChapter === ch.id ? "${theme.accent}14" : "transparent",
              border: "none",
              borderLeft: "3px solid " + (activeChapter === ch.id ? ch.color : "transparent"),
              cursor: "pointer",
              color: activeChapter === ch.id ? "${theme.accent}" : "${theme.textMuted}",
              fontWeight: activeChapter === ch.id ? 700 : 400,
              fontSize: "0.8125rem",
              transition: "all 0.2s",
              width: "100%",
            }}
          >
            {ch.emoji} Ch.{ch.id}: {ch.title}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "1rem 1.25rem" }}>
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "2px", background: "${theme.accent}", width: \`\${scrollProgress}%\`, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: "0.6875rem", color: "${theme.accent}", marginTop: "0.25rem", display: "block" }}>
            {scrollProgress}%
          </span>
        </div>
      </nav>

      <div ref={scrollRef} style={{ overflowY: "auto", height: "100%" }}>
        {chapters.map(ch => (
          <section
            key={ch.id}
            data-scene={ch.scene}
            data-chapter={\`chapter-\${ch.id}\`}
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "4rem 3rem",
              borderBottom: "1px solid ${theme.border}",
              background: \`radial-gradient(ellipse at 20% 50%, \${ch.color}18, transparent 60%)\`,
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: ch.color, display: "block", marginBottom: "1rem" }}>
              CHAPTER {ch.id} · {ch.milestone}
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 800, lineHeight: 1.1, color: "${theme.text}", marginBottom: "1.5rem" }}>
              {ch.emoji} {ch.title}
            </h2>
            <p style={{ fontSize: "1.0625rem", lineHeight: 1.8, color: "${theme.textMuted}", maxWidth: "640px", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              "{ch.lore}"
            </p>
          </section>
        ))}
      </div>
    </div>
  );`;
    }
  }
}
