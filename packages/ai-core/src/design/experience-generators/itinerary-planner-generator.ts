/**
 * ItineraryPlannerExperienceGenerator
 *
 * Generic experience-capability generator for interactive multi-day itinerary planners,
 * travel timelines, schedule builders, and stop coordinators.
 *
 * Parametric & domain-agnostic: instantiated purely from active product semantics,
 * page experience plan, theme colors, and generation seed.
 */

export interface ItineraryStop {
  id: string;
  day: number;
  time: string;
  title: string;
  location: string;
  category: string;
  notes: string;
  durationMinutes: number;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  dateStr: string;
  theme: string;
}

export interface ItineraryConfig {
  title: string;
  subtitle: string;
  description: string;
  actionButtonText: string;
  modalTitle: string;
  categories: string[];
  defaultCategory: string;
  defaultLocation: string;
  placeholderTitle: string;
  placeholderLocation: string;
  placeholderNotes: string;
  days: ItineraryDay[];
  stops: ItineraryStop[];
}

export interface ItineraryPlannerGeneratorOptions {
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

export class ItineraryPlannerExperienceGenerator {
  public static generate(options: ItineraryPlannerGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42, pageRole } = options;
    const promptLower = prompt.toLowerCase();

    const config = this.deriveConfig(promptLower, seed, brandName, pageRole);
    const theme = options.theme || this.deriveTheme(promptLower);

    return `import React, { useState } from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const initialDays = ${JSON.stringify(config.days, null, 4)};
  const initialStops = ${JSON.stringify(config.stops, null, 4)};

  const [activeDay, setActiveDay] = useState<number>(1);
  const [stops, setStops] = useState<Array<any>>(initialStops);
  const [isAddingStop, setIsAddingStop] = useState<boolean>(false);
  const [stopTitle, setStopTitle] = useState<string>("");
  const [stopTime, setStopTime] = useState<string>("12:30 PM");
  const [stopCategory, setStopCategory] = useState<string>("${config.defaultCategory}");
  const [stopLocation, setStopLocation] = useState<string>("");
  const [stopNotes, setStopNotes] = useState<string>("");

  const currentDayMeta = initialDays.find(d => d.dayNumber === activeDay) || initialDays[0];
  const dayStops = stops.filter(s => s.day === activeDay);

  const handleSaveStop = () => {
    if (!stopTitle.trim()) return;
    const newStop = {
      id: "stop-" + Date.now(),
      day: activeDay,
      time: stopTime,
      title: stopTitle.trim(),
      location: stopLocation.trim() || "${config.defaultLocation}",
      category: stopCategory,
      notes: stopNotes.trim() || "Curated stop added to itinerary schedule.",
      durationMinutes: 90
    };
    setStops([...stops, newStop]);
    setStopTitle("");
    setStopLocation("");
    setStopNotes("");
    setIsAddingStop(false);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
  };

  return (
    <div
      data-workspace="itinerary-planner"
      data-experience-variant="chronological_day_timeline"
      className="min-h-screen ${theme.bg} ${theme.text} px-4 sm:px-8 py-10 transition-colors"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb & Masthead */}
        <header className="border-b ${theme.border} pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest ${theme.accent} mb-2">
                ${config.subtitle}
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
                ${config.title}
              </h1>
              <p className="text-sm ${theme.textMuted} mt-2 max-w-xl">
                ${config.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddingStop(true)}
                className="px-4 py-2 text-xs font-mono bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-full transition-all shadow-md"
              >
                ${config.actionButtonText}
              </button>
            </div>
          </div>
        </header>

        {/* Day Schedule Timeline Tabs (day-schedule-timeline) */}
        <section aria-label="Day Selector Tabs" className="flex items-center gap-3 overflow-x-auto pb-2 border-b ${theme.border}">
          {initialDays.map(day => {
            const isActive = activeDay === day.dayNumber;
            const stopCount = stops.filter(s => s.day === day.dayNumber).length;
            return (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => setActiveDay(day.dayNumber)}
                className={\`px-5 py-2.5 rounded-xl font-mono text-xs transition-all text-left shrink-0 \${
                  isActive
                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm"
                    : "${theme.surface} ${theme.textMuted} hover:text-white border ${theme.border}"
                }\`}
              >
                <div className="font-bold flex items-center gap-2">
                  <span>Day {day.dayNumber}</span>
                  <span className="text-[10px] opacity-70 px-1.5 py-0.5 rounded-full bg-black/40">
                    {stopCount} stops
                  </span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate max-w-[140px] font-sans">
                  {day.theme}
                </div>
              </button>
            );
          })}
        </section>

        {/* Day Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl ${theme.surface} border ${theme.border} gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest ${theme.accent}">
              Active Schedule · Day {currentDayMeta.dayNumber}
            </span>
            <h2 className="text-xl font-serif font-bold text-white mt-1">
              {currentDayMeta.title}
            </h2>
            <p className="text-xs ${theme.textMuted} mt-1">
              Theme: {currentDayMeta.theme} · {dayStops.length} planned stops
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono ${theme.textMuted} bg-black/40 px-3 py-1.5 rounded-lg border ${theme.border}">
              Date: {currentDayMeta.dateStr}
            </span>
          </div>
        </div>

        {/* Day Schedule Timeline & Stop Cards (interactive-itinerary-builder) */}
        <section aria-label="Day Stops Timeline" className="relative pl-6 sm:pl-8 border-l-2 border-amber-500/30 space-y-6">
          {dayStops.length === 0 ? (
            <div className="p-8 text-center ${theme.surface} rounded-2xl border border-dashed ${theme.border}">
              <p className="text-sm text-stone-300">No scheduled stops for Day {activeDay}.</p>
              <button
                type="button"
                onClick={() => setIsAddingStop(true)}
                className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline font-mono"
              >
                + Click to schedule the first stop
              </button>
            </div>
          ) : (
            dayStops.map(stop => (
              <div key={stop.id} className="relative group">
                {/* Timeline node badge */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full bg-amber-400 border-4 border-stone-950 shadow-sm" />

                <div className="${theme.surface} border ${theme.border} rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                        {stop.time}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider ${theme.textMuted} bg-stone-900/60 px-2 py-0.5 rounded">
                        {stop.category}
                      </span>
                      <span className="text-xs ${theme.textMuted} font-mono">
                        ~{stop.durationMinutes} min
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-semibold text-white group-hover:text-amber-200 transition-colors">
                      {stop.title}
                    </h3>

                    <p className="text-xs text-stone-300 flex items-center gap-1.5 font-mono">
                      <span>📍</span> {stop.location}
                    </p>

                    <p className="text-xs ${theme.textMuted} leading-relaxed pt-1">
                      {stop.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.id)}
                      className="text-xs font-mono text-stone-500 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Modal: Schedule Dialog */}
        {isAddingStop && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" className="bg-stone-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-serif font-bold text-white">${config.modalTitle} · Day {activeDay}</h4>
                <button type="button" onClick={() => setIsAddingStop(false)} className="text-stone-400 hover:text-white text-lg font-bold">×</button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">Stop Title</label>
                <input
                  type="text"
                  required
                  value={stopTitle}
                  onChange={e => setStopTitle(e.target.value)}
                  placeholder="${config.placeholderTitle}"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="text"
                    value={stopTime}
                    onChange={e => setStopTime(e.target.value)}
                    placeholder="e.g. 01:00 PM"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={stopCategory}
                    onChange={e => setStopCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    ${config.categories.map(c => `<option value="${c}">${c}</option>`).join("\n                    ")}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">Location / Space</label>
                <input
                  type="text"
                  value={stopLocation}
                  onChange={e => setStopLocation(e.target.value)}
                  placeholder="${config.placeholderLocation}"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">Curator Notes</label>
                <textarea
                  value={stopNotes}
                  onChange={e => setStopNotes(e.target.value)}
                  rows={2}
                  placeholder="${config.placeholderNotes}"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStop(false)}
                  className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStop}
                  className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow"
                >
                  Confirm Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ${componentName};
`;
  }

  private static deriveConfig(promptLower: string, seed: number, brandName: string, pageRole?: string): ItineraryConfig {
    const isCulinary = /culinary|food|recipe|dish|gastronom|savorline|wine|dining|hearth|terroir/i.test(promptLower);
    const isMuseum = /museum|gallery|exhibition|curator|artwork|contemporary art|artist/i.test(promptLower);

    if (isCulinary) {
      return {
        title: "Custom Culinary Itinerary",
        subtitle: `${brandName} · Curated Journey & Itinerary Scheduler`,
        description: `Multi-day journey timeline coordinating dining reservations, market tours, cellar visits, and culinary masterclasses for ${brandName}.`,
        actionButtonText: "+ Plan Culinary Stop",
        modalTitle: "Plan Culinary Stop",
        categories: ["Dining", "Market", "Tasting", "Workshop", "Lodging"],
        defaultCategory: "Dining",
        defaultLocation: "Old Town Gastronomic Quarter",
        placeholderTitle: "e.g. Asador Embers Degustation",
        placeholderLocation: "e.g. Harbour Pier, Getaria",
        placeholderNotes: "e.g. Reserve table overlooking charcoal hearth...",
        days: [
          { dayNumber: 1, title: "San Sebastián Hearth Traditions", dateStr: "Day 1 · Autumn Harvest", theme: "Coastal Wood-Fire & Pintxo Guilds" },
          { dayNumber: 2, title: "Getaria Fishing Fleet & Txakoli Hills", dateStr: "Day 2 · Autumn Harvest", theme: "Sloped Vineyards & Whole Turbot Grilling" },
          { dayNumber: 3, title: "Arantzazu Valley & Mountain Shepherds", dateStr: "Day 3 · Autumn Harvest", theme: "Idiazabal Smoked Raw-Milk Cheese" }
        ],
        stops: [
          {
            id: "stop-1",
            day: 1,
            time: "09:30 AM",
            title: "La Bretxa Ancient Fish Market Ingress",
            location: "Old Town, San Sebastián",
            category: "Market",
            notes: "Meet fishmonger guilds as daily cantabrian hake and spider crabs arrive.",
            durationMinutes: 90
          },
          {
            id: "stop-1b",
            day: 1,
            time: "01:30 PM",
            title: "Private Txoko Gastronomic Society Lunch",
            location: "Calle 31 de Agosto",
            category: "Dining",
            notes: "Members-only cooking guild exploring heirloom bean stews and salt cod pil-pil.",
            durationMinutes: 120
          },
          {
            id: "stop-1c",
            day: 1,
            time: "06:30 PM",
            title: "Old Town Pintxo Crawl & Cider Pouring",
            location: "Parte Vieja alleys",
            category: "Tasting",
            notes: "Sample txangurro spider crab tarts and natural Basque sidra.",
            durationMinutes: 150
          },
          {
            id: "stop-2a",
            day: 2,
            time: "10:00 AM",
            title: "Txakoli Terraced Vineyard Walk",
            location: "Getaria Hillside Terraces",
            category: "Tasting",
            notes: "High-acidity Hondarrabi Zuri tasting overlooking the Bay of Biscay cliffs.",
            durationMinutes: 90
          },
          {
            id: "stop-2b",
            day: 2,
            time: "01:00 PM",
            title: "Harbourside Whole Turbot Masonry Hearth",
            location: "Port of Getaria",
            category: "Dining",
            notes: "Charcoal besugo baskets and aged olive oil emulsification masterclass.",
            durationMinutes: 150
          },
          {
            id: "stop-3a",
            day: 3,
            time: "11:00 AM",
            title: "Arantzazu Limestone Shepherd Mountain Dairy",
            location: "Aizkorri-Aratz Natural Park",
            category: "Workshop",
            notes: "Hawthorn-wood smoked Idiazabal curd pressing and sheep herd pasture hike.",
            durationMinutes: 180
          }
        ]
      };
    }

    if (isMuseum) {
      return {
        title: `${brandName} Visit & Exhibition Itinerary`,
        subtitle: `${brandName} · Curated Gallery Schedule & Visit Planner`,
        description: `Personalized exhibition walkthrough coordinating rotating gallery viewings, artist talks, audio tours, and spatial navigation for ${brandName}.`,
        actionButtonText: "+ Plan Gallery Stop",
        modalTitle: "Plan Gallery Stop",
        categories: ["Exhibition", "Gallery Wing", "Curator Talk", "Audio Tour", "Study Vault"],
        defaultCategory: "Exhibition",
        defaultLocation: "Main Atrium Pavilion",
        placeholderTitle: "e.g. Monumental Sculpture Monograph",
        placeholderLocation: "e.g. East Wing, Level 2",
        placeholderNotes: "e.g. Audio guide commentary at waypoint 4...",
        days: [
          { dayNumber: 1, title: `${brandName} Phase I: Pavilion & Permanent Masterworks`, dateStr: "Day 1 · Gallery Opening", theme: "Atrium Sculptures & Monumental Installations" },
          { dayNumber: 2, title: `${brandName} Phase II: Monographic Retrospectives`, dateStr: "Day 2 · Curatorial Deep Dive", theme: "Contemporary Artist Profiles & Spatial Studies" },
          { dayNumber: 3, title: `${brandName} Phase III: Acoustic Guides & Vault`, dateStr: "Day 3 · Curatorial Synthesis", theme: "Soundscapes, Waypoints & Saved Artworks" }
        ],
        stops: [
          {
            id: "stop-1",
            day: 1,
            time: "09:30 AM",
            title: "Monumental Atrium Ingress & Orientation",
            location: "Central Pavilion",
            category: "Exhibition",
            notes: "Orientation, spatial plinth overview, and curatorial introduction.",
            durationMinutes: 90
          },
          {
            id: "stop-2",
            day: 1,
            time: "01:30 PM",
            title: "Rotating Contemporary Installation Walkthrough",
            location: "East Wing Gallery",
            category: "Exhibition",
            notes: "Curator-guided exploration of featured artist retrospectives.",
            durationMinutes: 120
          },
          {
            id: "stop-3",
            day: 1,
            time: "05:00 PM",
            title: "Gallery Audio Guide & Curator Commentary",
            location: "South Wing Acoustic Array",
            category: "Audio Tour",
            notes: "Synchronized commentary listening session across gallery chambers.",
            durationMinutes: 60
          },
          {
            id: "stop-4",
            day: 2,
            time: "10:30 AM",
            title: "Artist Monograph & Spatial Study",
            location: "North Wing Atrium",
            category: "Gallery Wing",
            notes: "Close inspection of commissioned canvases and archival journals.",
            durationMinutes: 90
          },
          {
            id: "stop-5",
            day: 2,
            time: "02:00 PM",
            title: "Curatorial Conversation & Artist Dialogue",
            location: "Auditorium Chamber",
            category: "Curator Talk",
            notes: "Live panel dialogue on contemporary spatial aesthetics and light design.",
            durationMinutes: 120
          },
          {
            id: "stop-6",
            day: 3,
            time: "11:00 AM",
            title: "Personal Collection Vault Review",
            location: "Curatorial Study Room",
            category: "Study Vault",
            notes: "Review saved artwork dossier and curatorial notes.",
            durationMinutes: 90
          }
        ]
      };
    }

    // Default domain days & stops
    return {
      title: pageRole || `${brandName} Curated Itinerary`,
      subtitle: `${brandName} · Spatial Schedule & Journey Planner`,
      description: `Curated multi-stage journey timeline coordinating activities, waypoints, and milestones for ${brandName}.`,
      actionButtonText: "+ Plan Journey Stop",
      modalTitle: "Plan Journey Stop",
      categories: ["Milestone", "Session", "Workshop", "Review", "Orientation"],
      defaultCategory: "Orientation",
      defaultLocation: "Central Hub",
      placeholderTitle: "e.g. Orientation Session",
      placeholderLocation: "e.g. Room 101",
      placeholderNotes: "e.g. Key milestone notes and timing...",
      days: [
        { dayNumber: 1, title: `${brandName} Phase I: Orientation & Immersion`, dateStr: "Day 1", theme: "Foundations & Origin" },
        { dayNumber: 2, title: `${brandName} Phase II: Deep Dive Fieldwork`, dateStr: "Day 2", theme: "Practical Execution" },
        { dayNumber: 3, title: `${brandName} Phase III: Synthesis & Review`, dateStr: "Day 3", theme: "Curatorial Conclusion" }
      ],
      stops: [
        {
          id: "stop-1",
          day: 1,
          time: "09:00 AM",
          title: "Introductory Field Briefing",
          location: "Central Headquarters",
          category: "Orientation",
          notes: "Initial protocol alignment and spatial walkthrough.",
          durationMinutes: 90
        },
        {
          id: "stop-2",
          day: 1,
          time: "02:00 PM",
          title: "Core Workshop & Analysis",
          location: "Studio Laboratory",
          category: "Workshop",
          notes: "Structured inspection of key principles and operations.",
          durationMinutes: 120
        },
        {
          id: "stop-3",
          day: 2,
          time: "10:00 AM",
          title: "Specialized Field Session",
          location: "On-Site Facility",
          category: "Workshop",
          notes: "Direct engagement with local materials and techniques.",
          durationMinutes: 180
        }
      ]
    };
  }

  private static deriveTheme(promptLower: string) {
    return {
      bg: "bg-[#0c0a09]",
      surface: "bg-stone-900/70",
      border: "border-stone-800",
      accent: "text-amber-300",
      text: "text-stone-100",
      textMuted: "text-stone-400"
    };
  }
}
