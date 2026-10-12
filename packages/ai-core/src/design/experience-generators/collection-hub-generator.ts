/**
 * CollectionHubExperienceGenerator
 *
 * Generic experience-capability generator for saved discoveries, curated bookmarking hubs,
 * personal favorites archives, and collection folder managers.
 *
 * Parametric & domain-agnostic: instantiated purely from active product semantics,
 * page experience plan, theme colors, and generation seed.
 */

export interface SavedDiscoveryItem {
  id: string;
  title: string;
  subtitle: string;
  folder: string;
  category: string;
  region?: string;
  savedDate: string;
  notes: string;
  tags: string[];
  imageUrl?: string;
}

export interface CollectionHubGeneratorOptions {
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

export class CollectionHubExperienceGenerator {
  public static generate(options: CollectionHubGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42 } = options;
    const promptLower = prompt.toLowerCase();

    const config = this.deriveConfig(promptLower, seed, brandName);
    const theme = options.theme || this.deriveTheme(promptLower);

    const isCulinary = /culinary|food|recipe|dish|gastronom|savorline|wine|dining|hearth|terroir/i.test(promptLower);
    const isMuseum = /museum|art|gallery|exhibition|sculpture|painting|curator|monograph/i.test(promptLower);
    const emptyHint = isCulinary
      ? "Bookmark recipes, culinary stories, or travel destinations to view them here."
      : isMuseum
      ? "Bookmark exhibitions, artworks, or artist monographs to view them here."
      : "Bookmark artifacts, records, or curated items to view them here.";

    const noteModalDesc = isCulinary
      ? "Record culinary observations, tasting memories, or regional travel notes for this bookmark."
      : isMuseum
      ? "Record curatorial observations, gallery thoughts, or exhibition notes for this piece."
      : "Record notes, observations, or thoughts for this bookmark.";

    const notePlaceholder = isCulinary
      ? "e.g. Try with wild lingonberry coulis; visit producer early morning..."
      : isMuseum
      ? "e.g. Pair with curatorial audio track 03; note shadow geometry in East Wing..."
      : "e.g. Key observations and notes for future reference...";

    const hubTitle = isMuseum
      ? "Saved Artworks & Curated Vault"
      : isCulinary
      ? "Saved Culinary Discoveries"
      : (options.pageRole || "Saved Discoveries");

    const hubDescription = isMuseum
      ? `Curated artwork collection, exhibition bookmarks, artist monographs, and private study notes organized for ${brandName}.`
      : isCulinary
      ? `Curated regional food journeys, heirloom recipes, producer bookmarks, and private tasting notes organized for ${brandName}.`
      : `Curated bookmarks, resources, and private notes organized for ${brandName}.`;

    const countLabel = isMuseum ? "Artworks" : "Items";

    return `import React, { useState } from "react";
import { Link } from "react-router-dom";

export function ${componentName}() {
  const initialFolders = ${JSON.stringify(config.folders, null, 4)};
  const initialItems = ${JSON.stringify(config.items, null, 4)};

  const [folders, setFolders] = useState<string[]>(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string>("All");
  const [items, setItems] = useState<Array<any>>(initialItems);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  const filteredItems = activeFolder === "All"
    ? items
    : items.filter(item => item.folder.toLowerCase() === activeFolder.toLowerCase());

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const clean = newFolderName.trim();
    if (!folders.includes(clean)) {
      setFolders([...folders, clean]);
      setActiveFolder(clean);
    }
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.filter(item => item.id !== id));
  };

  const handleOpenNotes = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNotesId(item.id);
    setNoteText(item.notes || "");
  };

  const handleSaveNotes = () => {
    if (!editingNotesId) return;
    setItems(items.map(item => item.id === editingNotesId ? { ...item, notes: noteText } : item));
    setEditingNotesId(null);
  };

  return (
    <div
      data-workspace="saved-hub"
      data-experience-variant="folder_collection_grid"
      className="min-h-screen ${theme.bg} ${theme.text} px-4 sm:px-8 py-10 transition-colors"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb & Masthead */}
        <header className="border-b ${theme.border} pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-mono tracking-widest ${theme.accent} mb-2">
                ${brandName} · Curated Repository & Personal Vault
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
                ${hubTitle}
              </h1>
              <p className="text-sm ${theme.textMuted} mt-2 max-w-xl">
                ${hubDescription}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-3 py-1.5 rounded-full ${theme.surface} border ${theme.border} text-amber-200">
                {items.length} ${countLabel} Bookmarked
              </span>
            </div>
          </div>
        </header>

        {/* Collection Folder Navigation Bar (collection-folder-manager) */}
        <section aria-label="Collection Folders" className="flex flex-wrap items-center gap-2 pt-2 pb-4 border-b ${theme.border}">
          <span className="text-xs font-mono uppercase tracking-wider ${theme.textMuted} mr-2">
            Folders:
          </span>
          {folders.map(folder => {
            const count = folder === "All" ? items.length : items.filter(i => i.folder.toLowerCase() === folder.toLowerCase()).length;
            const isActive = activeFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={\`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 \${
                  isActive
                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm"
                    : "${theme.surface} ${theme.textMuted} hover:text-white border ${theme.border}"
                }\`}
              >
                <span>{folder}</span>
                <span className="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-black/40">
                  {count}
                </span>
              </button>
            );
          })}

          {isCreatingFolder ? (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder title..."
                className="px-2.5 py-1 text-xs bg-stone-900 border border-amber-500/50 rounded-lg text-white focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-2 py-1 text-xs bg-amber-500 text-stone-950 font-semibold rounded-lg hover:bg-amber-400"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-1 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingFolder(true)}
              className="text-xs text-amber-400/80 hover:text-amber-300 font-mono flex items-center gap-1 px-3 py-1.5 border border-dashed border-amber-500/30 rounded-full hover:border-amber-400/60 transition-all ml-1"
            >
              + New Collection Folder
            </button>
          )}
        </section>

        {/* Saved Discovery Cards Grid (discovery-bookmark-hub) */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 border border-dashed ${theme.border} rounded-2xl ${theme.surface}">
            <p className="text-sm font-medium text-stone-300">No saved discoveries in folder "{activeFolder}".</p>
            <p className="text-xs ${theme.textMuted} mt-1">${emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <article
                key={item.id}
                onClick={() => setSelectedItemDetail(item)}
                className="group relative cursor-pointer ${theme.surface} border ${theme.border} rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-mono ${theme.textMuted}">
                      {item.savedDate}
                    </span>
                  </div>

                  <h3 className="text-lg font-serif font-semibold text-white group-hover:text-amber-200 transition-colors mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-4">
                    {item.subtitle}
                  </p>

                  {item.notes && (
                    <div className="bg-black/30 border-l-2 border-amber-400/70 p-2.5 rounded-r text-[11px] text-amber-100/90 italic mb-4">
                      "{item.notes}"
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] font-mono text-stone-400 bg-stone-900/60 px-2 py-0.5 rounded border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t ${theme.border} flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleOpenNotes(item, e)}
                    className="text-stone-400 hover:text-amber-300 font-mono text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>✎ {item.notes ? "Edit Note" : "+ Add Note"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="text-stone-500 hover:text-rose-400 text-[11px] font-mono transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal: Add/Edit Field Note */}
        {editingNotesId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h4 className="text-base font-serif font-bold text-white">Curator Field Note</h4>
              <p className="text-xs text-stone-400">${noteModalDesc}</p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={4}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                placeholder="${notePlaceholder}"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNotesId(null)}
                  className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer: Item Detail Modal */}
        {selectedItemDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItemDetail(null)}>
            <div className="bg-stone-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-300 uppercase tracking-widest">{selectedItemDetail.category} · {selectedItemDetail.folder}</span>
                <button type="button" onClick={() => setSelectedItemDetail(null)} className="text-stone-400 hover:text-white text-lg font-bold">×</button>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">{selectedItemDetail.title}</h3>
              <p className="text-xs text-stone-300 leading-relaxed">{selectedItemDetail.subtitle}</p>
              {selectedItemDetail.notes && (
                <div className="bg-stone-950 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-100 italic">
                  Field Note: "{selectedItemDetail.notes}"
                </div>
              )}
              <div className="flex justify-end pt-3">
                <button type="button" onClick={() => setSelectedItemDetail(null)} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs rounded-lg font-mono">
                  Close Preview
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

  private static deriveConfig(promptLower: string, seed: number, brandName: string) {
    const isMuseum = /\b(museum|art museum|contemporary art|gallery|curator|exhibition|artwork|saved-artwork|artworks)\b/i.test(promptLower);
    if (isMuseum) {
      return {
        folders: ["All", "Sculpture", "Paintings", "Installations", "Audio Tours"],
        items: [
          {
            id: "art-1",
            title: "Monolith in Cast Bronze No. 7",
            subtitle: "Monumental patinated bronze structure exploring void, mass, and natural light refraction.",
            folder: "Sculpture",
            category: "Sculpture",
            region: "North Atrium, Gallery 01",
            savedDate: "Oct 2026",
            notes: "Curator notes emphasize viewing during afternoon raking light.",
            tags: ["bronze", "monolith", "spatial-form"]
          },
          {
            id: "art-2",
            title: "Chromatophore Drift: Study in Indigo",
            subtitle: "Layered oil on unprimed Belgian linen investigating atmospheric pigment depth.",
            folder: "Paintings",
            category: "Painting",
            region: "East Wing, Level 2",
            savedDate: "Oct 2026",
            notes: "Pair with Curator commentary track 03.",
            tags: ["oil-on-linen", "monochrome", "pigment"]
          },
          {
            id: "art-3",
            title: "Acoustic Resonance Chamber & Light Ribs",
            subtitle: "Site-specific generative light projection with tuned spatial frequency response.",
            folder: "Installations",
            category: "Installation",
            region: "South Pavilion",
            savedDate: "Sep 2026",
            notes: "Timed entry required; recommended 20-minute immersive stay.",
            tags: ["light-installation", "acoustic", "immersive"]
          },
          {
            id: "art-4",
            title: "Curatorial Audio Walkthrough: Form & Shadow",
            subtitle: "34-minute curator guide covering modern European and Japanese minimalist sculptors.",
            folder: "Audio Tours",
            category: "Audio Guide",
            region: "Museum Wings 1–4",
            savedDate: "Sep 2026",
            notes: "Listen with over-ear monitors for optimal binaural depth.",
            tags: ["audio-guide", "curator-voice", "walkthrough"]
          }
        ]
      };
    }

    const isCulinary = /culinary|food|recipe|dish|gastronom|savorline|wine|dining|hearth|terroir/i.test(promptLower);

    if (isCulinary) {
      return {
        folders: ["All", "Recipes", "Stories", "Destinations", "Producers"],
        items: [
          {
            id: "disc-1",
            title: "Nordic Fermented Chanterelle Tartine",
            subtitle: "Wood-fired sourdough with lacto-fermented chanterelles, juniper emulsion, and mountain sorrel.",
            folder: "Recipes",
            category: "Recipe",
            region: "Jämtland, Sweden",
            savedDate: "Oct 2026",
            notes: "Scale to 6 servings for autumn dinner party; reserve pine-oil infusion.",
            tags: ["heirloom-grain", "fermentation", "foraged"]
          },
          {
            id: "disc-2",
            title: "Basque Masonry Hearths & Turbot Guilds",
            subtitle: "Centuries of open-fire grilling on the cliffs of Getaria using lumpwood oak embers.",
            folder: "Destinations",
            category: "Destination",
            region: "Basque Country, Spain",
            savedDate: "Oct 2026",
            notes: "Port authority morning auction takes place at 07:30 daily.",
            tags: ["wood-fire", "coastal", "terroir"]
          },
          {
            id: "disc-3",
            title: "The Kyoto Dashi Master Monograph",
            subtitle: "Three generations perfecting aged ma-kombu and katsuobushi broth extraction.",
            folder: "Stories",
            category: "Story",
            region: "Kyoto, Japan",
            savedDate: "Sep 2026",
            notes: "Technique guide referenced water mineral hardness below 30ppm.",
            tags: ["umami", "artisan-heritage", "masterclass"]
          },
          {
            id: "disc-4",
            title: "Oaxacan Mole Negro & Criollo Cacao",
            subtitle: "Twenty-eight ingredients roasted on comales under clay chimney ovens.",
            folder: "Recipes",
            category: "Recipe",
            region: "Oaxaca, Mexico",
            savedDate: "Sep 2026",
            notes: "Seek chilhuacle negro chiles directly from Central Valleys.",
            tags: ["heritage-sauce", "cacao", "smoke"]
          },
          {
            id: "disc-5",
            title: "Etna Volcanic Soil Viticulture",
            subtitle: "Ancient pre-phylloxera Nerello Mascalese vines thriving on black basalt terraces.",
            folder: "Producers",
            category: "Producer",
            region: "Sicily, Italy",
            savedDate: "Aug 2026",
            notes: "Harvest begins mid-October; tasting room by appointment.",
            tags: ["volcanic-terroir", "natural-wine", "vineyard"]
          }
        ]
      };
    }

    // Default domain items
    return {
      folders: ["All", "Highlights", "Case Studies", "Archives"],
      items: [
        {
          id: "disc-1",
          title: `${brandName} Principal Showcase`,
          subtitle: "Seminal curated selection reflecting authentic spatial and material craft.",
          folder: "Highlights",
          category: "Featured",
          savedDate: "Oct 2026",
          notes: "Essential reference for core aesthetic and technical composition.",
          tags: ["core", "flagship"]
        },
        {
          id: "disc-2",
          title: "Monograph Archive Volume I",
          subtitle: "Comprehensive theoretical and practical exploration with full annotations.",
          folder: "Case Studies",
          category: "Archive",
          savedDate: "Sep 2026",
          notes: "Review methodology in section 3.",
          tags: ["monograph", "documentation"]
        },
        {
          id: "disc-3",
          title: "Curatorial Field Study & Material Ledger",
          subtitle: "Systematic investigation of regional materials and generational techniques.",
          folder: "Archives",
          category: "Research",
          savedDate: "Aug 2026",
          notes: "Field observations verified on-site.",
          tags: ["fieldwork", "materials"]
        }
      ]
    };
  }

  private static deriveTheme(promptLower: string) {
    if (/\b(museum|art museum|contemporary art|gallery|curator)\b/i.test(promptLower)) {
      return {
        bg: "bg-[#0a0a0a]",
        surface: "bg-[#141414]/90",
        border: "border-neutral-800",
        accent: "text-amber-400",
        text: "text-neutral-100",
        textMuted: "text-neutral-400"
      };
    }
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
