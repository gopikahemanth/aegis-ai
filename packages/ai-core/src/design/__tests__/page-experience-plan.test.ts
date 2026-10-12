import { describe, it, expect } from "vitest";
import { PageExperiencePlanner } from "../page-experience-plan";

describe("PageExperiencePlanner - Aerospace Domain Planning & Anti-Hijack", () => {
  const stratosPrompt = `
Build STRATOS AVIONICS, an integrated flight operations and telemetry platform.
Features:
- Live flight telemetry display (pitch, roll, yaw, airspeed, altitude)
- Aircraft fleet management with tail numbers and airframe status
- Real-time sensor bus monitoring with alert thresholds
- Flight plan routing with interactive waypoints
- PostgreSQL persistence where required by the architecture
`;

  it("assigns operational telemetry roles rather than editorial monograph roles for aerospace prompt mentioning architecture", () => {
    const routes = ["/", "/aircraft-fleet", "/telemetry", "/flight-plans"];
    const planned = PageExperiencePlanner.plan(stratosPrompt, routes);

    expect(planned.pages).toHaveLength(4);

    for (const page of planned.pages) {
      // Must NOT be assigned editorial publication or monograph roles
      expect(page.pageRole).not.toMatch(/Monograph|Publication Folio|Curatorial/i);
      expect(page.forbiddenPatterns).toContain("monograph");
      expect(page.forbiddenPatterns).toContain("editorial publication");
    }

    const homePage = planned.pages.find(p => p.route === "/");
    expect(homePage?.pageRole).toMatch(/Avionics|Telemetry|Flight Deck|Command/i);

    const fleetPage = planned.pages.find(p => p.route === "/aircraft-fleet");
    expect(fleetPage?.pageRole).toMatch(/Fleet|Airspace|Aircraft/i);

    const telemetryPage = planned.pages.find(p => p.route === "/telemetry");
    expect(telemetryPage?.pageRole).toMatch(/Telemetry|Sensor|Data Recorder/i);
  });

  it("still assigns editorial publication roles when prompt is an actual architecture monograph journal", () => {
    const archJournalPrompt = `
Build TECTONIC, an architectural monograph and design review journal exploring contemporary spatial practice and building typologies.
Features:
- Curated building typology index (timber, stone, post-industrial)
- In-depth architectural monographs with essays and high-res photography
- Issue back-catalog archive
`;
    const routes = ["/", "/archive", "/typologies"];
    const planned = PageExperiencePlanner.plan(archJournalPrompt, routes);

    const homePage = planned.pages.find(p => p.route === "/");
    expect(homePage?.pageRole).toMatch(/Monograph Cover|Opening Essay/i);
  });
});
