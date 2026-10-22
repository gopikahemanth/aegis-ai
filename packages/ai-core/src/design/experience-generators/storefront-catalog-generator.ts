/**
 * StorefrontCatalogExperienceGenerator
 *
 * Universal, domain-adaptive experience-capability generator for curated retail storefronts,
 * independent bookstores, automotive detailing salons, artisan bakeries, clinical practices,
 * and service catalogs with interactive cart/booking drawers and real-time checkout routing.
 *
 * Fully parametric & domain-scoped: mounts authentic physical catalog grid,
 * genre/category filtering, live search, domain cover/card styling, domain-specific feature pills,
 * and an interactive sliding cart/booking drawer with real-time checkout routing.
 */

export interface StorefrontCatalogGeneratorOptions {
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

export interface CatalogProductRecord {
  id: string;
  title: string;
  author?: string;
  category: string;
  format?: string;
  price: number;
  isbn?: string;
  stock: number;
  staffPick?: boolean;
  synopsis?: string;
  botanicalPairing?: string;
  botanicalPrice?: number;
  highlightTag?: string;
  highlightDetail?: string;
  coverColor?: string;
  accentColor?: string;
  rating?: number;
}

export class StorefrontCatalogExperienceGenerator {
  public static deriveDomainCatalog(prompt: string, brandName: string) {
    const promptLower = (prompt || "").toLowerCase();

    const isBookstore = /book|reading|literature|author|poetry|novel|publishing|petal/i.test(promptLower);
    const isCarwash = /wash|car|auto|vehicle|detailing|fleet/i.test(promptLower);
    const isBakery = /bakery|bread|pastry|cake|sourdough|bakes|culinary|cafe|coffee|roast/i.test(promptLower);
    const isClinic = /clinic|health|medical|doctor|patient|dental|wellness|therapy/i.test(promptLower);

    if (isBookstore) {
      return {
        domainCategory: "books",
        domainLabel: "Books & Editions",
        badge: "Independent Literary Press & Vault",
        badgeIcon: "BookOpen",
        heroTitle: `${brandName} Curated Books & Living Botanicals`,
        heroSubtitle: "Explore hand-selected fiction, translated poetry, rare annotated first editions, and living botanical book companions.",
        itemNoun: "Edition",
        itemNounPlural: "Editions",
        actionLabel: "Add to Bag",
        cartLabel: "Shopping Bag",
        searchPlaceholder: "Search title, author, or synopsis...",
        emptyTitle: "No Editions Found",
        emptyDesc: 'No titles match your current search criteria. Try selecting "All Editions" or clearing your search.',
        secondaryFeatureLabel: "Living Botanical Complement",
        secondaryFeatureKey: "botanicalPairing",
        secondaryFeatureIcon: "Sprout",
        isPhysicalCover: true,
        theme: {
          bg: "#FAF7F2",
          cardBg: "bg-white",
          cardBorder: "border-[#1C3D2E]/12",
          cardBorderHover: "hover:border-[#1C3D2E]/40",
          textPrimary: "text-[#1C2822]",
          textSecondary: "text-[#52665B]",
          fontFamily: "font-serif",
          accent: "#1C3D2E",
          accentSecondary: "#C87A54",
          btnPrimary: "bg-[#1C3D2E] text-[#FAF7F2] hover:bg-[#254F3C]",
          btnCart: "bg-[#1C3D2E] text-[#FAF7F2] hover:bg-[#254F3C]",
          cartBg: "bg-[#FAF7F2]",
          heroBannerBg: "bg-[#F5EFEB]/70",
          heroBannerBorder: "border-[#1C3D2E]/10",
        },
        products: [
          {
            id: "bk-01",
            title: "The Overstory",
            author: "Richard Powers",
            category: "Literary Fiction",
            format: "Hardcover",
            price: 32,
            isbn: "978-0393635522",
            stock: 14,
            staffPick: true,
            synopsis: "A monumental narrative mapping out nine Americans whose unique life experiences intertwine with trees, nature, and the human struggle to save the living world.",
            botanicalPairing: "Potted Bonsai Ficus Microcarpa",
            botanicalPrice: 45,
            coverColor: "#1C3D2E",
            accentColor: "#C87A54",
            rating: 5,
          },
          {
            id: "bk-02",
            title: "Braiding Sweetgrass",
            author: "Robin Wall Kimmerer",
            category: "Ecology & Nature",
            format: "Paperback",
            price: 20,
            isbn: "978-1571313560",
            stock: 22,
            staffPick: true,
            synopsis: "Drawing on her life as an indigenous scientist, Kimmerer demonstrates how living plants and animals offer humanity our oldest, most generous teachings.",
            botanicalPairing: "Dried Sweetgrass & Lavender Bundle",
            botanicalPrice: 18,
            coverColor: "#2A4736",
            accentColor: "#D4A373",
            rating: 5,
          },
          {
            id: "bk-03",
            title: "Piranesi",
            author: "Susanna Clarke",
            category: "Speculative Fiction",
            format: "Hardcover",
            price: 27,
            isbn: "978-1635575637",
            stock: 8,
            staffPick: false,
            synopsis: "Piranesi lives in the House. Perhaps he always has. The House is infinite, with thousands of rooms lined with statues and tides that surge up staircases.",
            botanicalPairing: "Trailing Marble Queen Pothos",
            botanicalPrice: 24,
            coverColor: "#1F2B37",
            accentColor: "#E0A96D",
            rating: 5,
          },
          {
            id: "bk-04",
            title: "Selected Poems",
            author: "Anna Akhmatova",
            category: "Poetry",
            format: "Paperback",
            price: 22.5,
            isbn: "978-0930051731",
            stock: 5,
            staffPick: true,
            synopsis: "Definitive translation of one of Russia's greatest 20th-century poets, chronicling intimate sorrow, political terror, and the triumph of the human voice.",
            botanicalPairing: "Preserved Silver Dollar Eucalyptus",
            botanicalPrice: 15,
            coverColor: "#3B2F2F",
            accentColor: "#C5A059",
            rating: 5,
          },
          {
            id: "bk-05",
            title: "On Earth We're Briefly Gorgeous",
            author: "Ocean Vuong",
            category: "Literary Fiction",
            format: "Paperback",
            price: 18,
            isbn: "978-0525562047",
            stock: 16,
            staffPick: true,
            synopsis: "Written as a letter from a son to an illiterate mother, unearthing history, trauma, first love, and the fragile redemptive power of telling one's story.",
            botanicalPairing: "Japanese Calathea Lancifolia",
            botanicalPrice: 28,
            coverColor: "#3D3A45",
            accentColor: "#E8C547",
            rating: 4.8,
          },
          {
            id: "bk-06",
            title: "The Dispossessed",
            author: "Ursula K. Le Guin",
            category: "Speculative Fiction",
            format: "Hardcover",
            price: 29,
            isbn: "978-0060512750",
            stock: 11,
            staffPick: false,
            synopsis: "A brilliant physicist journeys between two contrasting planetary societies—anarchist Anarres and capitalist Urras—to reconcile quantum simultaneity and human freedom.",
            botanicalPairing: "Air Plant Ionantha Trio in Terracotta",
            botanicalPrice: 22,
            coverColor: "#2C3E50",
            accentColor: "#E67E22",
            rating: 5,
          },
        ],
      };
    }

    if (isCarwash) {
      return {
        domainCategory: "automotive",
        domainLabel: "Detailing Packages & Bay Services",
        badge: "Certified Ceramic & Detailing Bays",
        badgeIcon: "Sparkles",
        heroTitle: `${brandName} Detailing Packages & Service Bays`,
        heroSubtitle: "Professional multi-stage ceramic coatings, active foam exterior baths, interior steam extraction, and express touchless lines.",
        itemNoun: "Package",
        itemNounPlural: "Packages",
        actionLabel: "Select Package",
        cartLabel: "Selected Services",
        searchPlaceholder: "Search treatment, package, or vehicle type...",
        emptyTitle: "No Packages Found",
        emptyDesc: 'No treatments match your current filter. Try selecting "All Packages" or clearing your search.',
        secondaryFeatureLabel: "Treatment Guarantee & Inclusions",
        secondaryFeatureKey: "highlightDetail",
        secondaryFeatureIcon: "CheckCircle",
        isPhysicalCover: false,
        theme: {
          bg: "#0B1120",
          cardBg: "bg-slate-900/90",
          cardBorder: "border-slate-800",
          cardBorderHover: "hover:border-sky-500/50",
          textPrimary: "text-slate-100",
          textSecondary: "text-slate-400",
          fontFamily: "font-sans",
          accent: "#0284C7",
          accentSecondary: "#38BDF8",
          btnPrimary: "bg-sky-500 text-slate-950 font-bold hover:bg-sky-400",
          btnCart: "bg-sky-500 text-slate-950 font-bold hover:bg-sky-400",
          cartBg: "bg-slate-900",
          heroBannerBg: "bg-slate-900/80",
          heroBannerBorder: "border-slate-800",
        },
        products: [
          {
            id: "cw-01",
            title: "Ceramic Shield Detail",
            author: "Master Technician Bay 1",
            category: "Premium Detailing",
            format: "45 mins · 9H Nano-Coat",
            price: 149,
            isbn: "SRV-CERAMIC",
            stock: 6,
            staffPick: true,
            synopsis: "Multi-stage surface decontamination, paint enhancement polish, and 9H dual-layer hydrophobic ceramic nano-sealant with 2-year warranty.",
            highlightTag: "Warranty Included",
            highlightDetail: "2-Year Hydrophobic Coating Guarantee",
            coverColor: "#0369A1",
            accentColor: "#38BDF8",
            rating: 5,
          },
          {
            id: "cw-02",
            title: "Deluxe Foam Exterior",
            author: "High-Pressure Bay 2",
            category: "Exterior Wash",
            format: "20 mins · pH Neutral",
            price: 39,
            isbn: "SRV-FOAM",
            stock: 12,
            staffPick: false,
            synopsis: "Active pH-neutral snow foam bath, micro-fiber contact wash, wheel de-ironizing treatment, and spot-free deionized reverse-osmosis rinse.",
            highlightTag: "Deionized Rinse",
            highlightDetail: "Zero-Water-Spot Heated Air Dry",
            coverColor: "#1E293B",
            accentColor: "#0284C7",
            rating: 4.9,
          },
          {
            id: "cw-03",
            title: "Interior Steam Sanitization",
            author: "Detailing Specialists",
            category: "Interior Care",
            format: "35 mins · Deep Extraction",
            price: 89,
            isbn: "SRV-INTERIOR",
            stock: 8,
            staffPick: true,
            synopsis: "210°F pressurized steam vent extraction, deep hot-water shampoo carpet extraction, leather hydration conditioning, and cabin ozone sanitization.",
            highlightTag: "99.9% Bacteria Free",
            highlightDetail: "Organic Essential Oil Deodorizer",
            coverColor: "#0F172A",
            accentColor: "#38BDF8",
            rating: 5,
          },
          {
            id: "cw-04",
            title: "Express Touchless Wash",
            author: "Automated Line 3",
            category: "Express Line",
            format: "10 mins · Laser Contour",
            price: 19,
            isbn: "SRV-EXPRESS",
            stock: 25,
            staffPick: false,
            synopsis: "Optical laser profile contouring, high-pressure oscillating wheel blast, chassis undercarriage wash, and automated warm air hurricane dry.",
            highlightTag: "Express Speed",
            highlightDetail: "Undercarriage Salt & Grit Flush",
            coverColor: "#1E3A8A",
            accentColor: "#60A5FA",
            rating: 4.7,
          },
          {
            id: "cw-05",
            title: "Full Spectrum Treatment",
            author: "Signature Bay",
            category: "Full Detail",
            format: "60 mins · Full Vehicle",
            price: 219,
            isbn: "SRV-SPECTRUM",
            stock: 4,
            staffPick: true,
            synopsis: "Comprehensive bumper-to-bumper transformation: full exterior clay bar and machine polish paired with exhaustive interior leather and fabric restoration.",
            highlightTag: "Showroom Finish",
            highlightDetail: "Clay Bar + Dual-Action Polish + Interior Ozone",
            coverColor: "#172554",
            accentColor: "#38BDF8",
            rating: 5,
          },
          {
            id: "cw-06",
            title: "Engine Bay Deep Detail",
            author: "Mechanical Detail Team",
            category: "Specialized Care",
            format: "25 mins · Precision Degrease",
            price: 59,
            isbn: "SRV-ENGINE",
            stock: 7,
            staffPick: false,
            synopsis: "Sensitive electrical component shielding, citrus degreaser steam application, thermal rinse, and anti-static satin protective dressing.",
            highlightTag: "Thermal Safe",
            highlightDetail: "Anti-Static Protective Dressing",
            coverColor: "#1E293B",
            accentColor: "#0EA5E9",
            rating: 4.8,
          },
        ],
      };
    }

    if (isBakery) {
      return {
        domainCategory: "bakery",
        domainLabel: "Artisan Bakes & Batches",
        badge: "Stone Hearth Artisan Bakehouse",
        badgeIcon: "Bookmark",
        heroTitle: `${brandName} Fresh Oven Batches & Sourdough`,
        heroSubtitle: "Stone-ground heritage flours, 36-hour slow wild fermentation, and European cultured butter laminations fresh from the hearth.",
        itemNoun: "Bake",
        itemNounPlural: "Bakes",
        actionLabel: "Order Batch",
        cartLabel: "Oven Box",
        searchPlaceholder: "Search bakes, flours, or morning batches...",
        emptyTitle: "No Bakes Found",
        emptyDesc: 'No items match your selected filter. Try selecting "All Bakes" or clearing your search.',
        secondaryFeatureLabel: "Flour Provenance & Fermentation",
        secondaryFeatureKey: "highlightDetail",
        secondaryFeatureIcon: "Star",
        isPhysicalCover: false,
        theme: {
          bg: "#FAF8F5",
          cardBg: "bg-white",
          cardBorder: "border-amber-900/10",
          cardBorderHover: "hover:border-amber-700/40",
          textPrimary: "text-stone-900",
          textSecondary: "text-stone-600",
          fontFamily: "font-serif",
          accent: "#78350F",
          accentSecondary: "#D97706",
          btnPrimary: "bg-amber-800 text-amber-50 hover:bg-amber-900",
          btnCart: "bg-amber-800 text-amber-50 hover:bg-amber-900",
          cartBg: "bg-[#FAF8F5]",
          heroBannerBg: "bg-amber-50/60",
          heroBannerBorder: "border-amber-900/10",
        },
        products: [
          {
            id: "bk-01",
            title: "Heritage Sourdough Batard",
            author: "Master Baker",
            category: "Artisan Loaves",
            format: "850g · Wild Ferment",
            price: 9.5,
            isbn: "BAKE-01",
            stock: 24,
            staffPick: true,
            synopsis: "100% stone-milled organic heritage wheat, natural levain culture, blistered caramelized crust, and an airy custard-like open crumb.",
            highlightTag: "Daily Special",
            highlightDetail: "36-hr Cold Ferment · Pasayten Heritage Wheat",
            coverColor: "#78350F",
            accentColor: "#D97706",
            rating: 5,
          },
          {
            id: "bk-02",
            title: "Almond Frangipane Croissant",
            author: "Viennoiserie Station",
            category: "Pastries",
            format: "Twice Baked",
            price: 5.75,
            isbn: "BAKE-02",
            stock: 36,
            staffPick: true,
            synopsis: "Normandy cultured butter lamination layered with house-made Marcona almond cream, orange blossom syrup, and toasted sliced almonds.",
            highlightTag: "Staff Pick",
            highlightDetail: "84% Normandy Beurre d'Isigny Butter",
            coverColor: "#92400E",
            accentColor: "#F59E0B",
            rating: 5,
          },
          {
            id: "bk-03",
            title: "Cardamom Morning Bun",
            author: "Sweet Hearth",
            category: "Pastries",
            format: "Sugar Crusted",
            price: 5.0,
            isbn: "BAKE-03",
            stock: 30,
            staffPick: false,
            synopsis: "Slow-fermented brioche rolled with freshly ground green Guatemalan cardamom, cinnamon, and raw demerara sugar crust.",
            highlightTag: "Morning Batch",
            highlightDetail: "Stone-Ground Green Cardamom Pods",
            coverColor: "#B45309",
            accentColor: "#D97706",
            rating: 4.9,
          },
          {
            id: "bk-04",
            title: "Rosemary Sea Salt Focaccia",
            author: "Savory Deck",
            category: "Savory Bakes",
            format: "Half Slab",
            price: 8.0,
            isbn: "BAKE-04",
            stock: 16,
            staffPick: false,
            synopsis: "High-hydration dough dimpled with Sicilian extra virgin olive oil, fresh garden rosemary sprigs, and flaky Maldon sea salt.",
            highlightTag: "Savory",
            highlightDetail: "First Cold-Pressed Sicilian Olive Oil",
            coverColor: "#451A03",
            accentColor: "#D97706",
            rating: 4.8,
          },
          {
            id: "bk-05",
            title: "Rustic Baguette Tradition",
            author: "Hearth Station",
            category: "Artisan Loaves",
            format: "350g · Direct Hearth",
            price: 4.5,
            isbn: "BAKE-05",
            stock: 40,
            staffPick: true,
            synopsis: "Classic French tradition baguette with deep caramelization, light honeycomb structure, and sweet wheaty finish.",
            highlightTag: "Classic",
            highlightDetail: "Unbleached French T65 Flour",
            coverColor: "#854D0E",
            accentColor: "#F59E0B",
            rating: 5,
          },
          {
            id: "bk-06",
            title: "Valrhona Chocolate Babka",
            author: "Specialty Bakes",
            category: "Sweet Bakes",
            format: "Loaf Box",
            price: 14.0,
            isbn: "BAKE-06",
            stock: 12,
            staffPick: false,
            synopsis: "Twisted rich brioche ribboned with 70% dark Valrhona chocolate ganache, cocoa streusel crumble, and vanilla syrup glaze.",
            highlightTag: "Indulgence",
            highlightDetail: "70% Single-Origin Valrhona Dark Ganache",
            coverColor: "#3E2723",
            accentColor: "#D97706",
            rating: 5,
          },
        ],
      };
    }

    if (isClinic) {
      return {
        domainCategory: "clinical",
        domainLabel: "Clinical Consultations & Care Services",
        badge: "Accredited Health & Wellness Practice",
        badgeIcon: "CheckCircle",
        heroTitle: `${brandName} Clinical Care & Consultations`,
        heroSubtitle: "Comprehensive evaluations, preventive diagnostics, dedicated specialist consultations, and personalized care pathways.",
        itemNoun: "Consultation",
        itemNounPlural: "Consultations",
        actionLabel: "Book Appointment",
        cartLabel: "Care Plan",
        searchPlaceholder: "Search clinical service, specialty, or physician...",
        emptyTitle: "No Services Found",
        emptyDesc: 'No care pathways match your current search. Try selecting "All Consultations" or clearing your filter.',
        secondaryFeatureLabel: "Clinical Protocol & Inclusions",
        secondaryFeatureKey: "highlightDetail",
        secondaryFeatureIcon: "CheckCircle",
        isPhysicalCover: false,
        theme: {
          bg: "#F8FAFC",
          cardBg: "bg-white",
          cardBorder: "border-slate-200",
          cardBorderHover: "hover:border-teal-600/50",
          textPrimary: "text-slate-900",
          textSecondary: "text-slate-600",
          fontFamily: "font-sans",
          accent: "#0D9488",
          accentSecondary: "#14B8A6",
          btnPrimary: "bg-teal-700 text-white hover:bg-teal-800",
          btnCart: "bg-teal-700 text-white hover:bg-teal-800",
          cartBg: "bg-white",
          heroBannerBg: "bg-teal-50/50",
          heroBannerBorder: "border-teal-100",
        },
        products: [
          {
            id: "cl-01",
            title: "Comprehensive Health Intake",
            author: "Primary Care Team",
            category: "Primary Care",
            format: "45 mins · In-Clinic / Virtual",
            price: 150,
            isbn: "APT-101",
            stock: 10,
            staffPick: true,
            synopsis: "Holistic baseline assessment reviewing family history, full metabolic panel, vital biomarkers, and tailored lifestyle health roadmap.",
            highlightTag: "Recommended Intake",
            highlightDetail: "Full Biomarker Panel + Physician Consult",
            coverColor: "#0D9488",
            accentColor: "#14B8A6",
            rating: 5,
          },
          {
            id: "cl-02",
            title: "Preventive Wellness Review",
            author: "Wellness Clinicians",
            category: "Preventive Care",
            format: "30 mins · Wellness Suite",
            price: 95,
            isbn: "APT-102",
            stock: 14,
            staffPick: false,
            synopsis: "Focused annual checkup evaluating cardiovascular health, posture biomechanics, stress recovery metrics, and vaccination updates.",
            highlightTag: "Preventive",
            highlightDetail: "Cardiovascular Screen + Biometric Vitals",
            coverColor: "#0F766E",
            accentColor: "#2DD4BF",
            rating: 4.9,
          },
          {
            id: "cl-03",
            title: "Specialist Physician Consultation",
            author: "Board-Certified Specialists",
            category: "Specialized Care",
            format: "60 mins · In-Person",
            price: 200,
            isbn: "APT-103",
            stock: 5,
            staffPick: true,
            synopsis: "Deep clinical review with dedicated medical specialist for complex symptoms, imaging second opinions, and targeted therapies.",
            highlightTag: "Specialist Care",
            highlightDetail: "Detailed Diagnostic Dossier & Chart Notes",
            coverColor: "#115E59",
            accentColor: "#5EEAD4",
            rating: 5,
          },
          {
            id: "cl-04",
            title: "Diagnostic Imaging Follow-up",
            author: "Radiology & Care Team",
            category: "Diagnostics",
            format: "30 mins · Review Bay",
            price: 120,
            isbn: "APT-104",
            stock: 8,
            staffPick: false,
            synopsis: "Cross-sectional analysis of MRI, ultrasound, or digital X-ray results with clear clinical interpretations and next actions.",
            highlightTag: "Imaging Review",
            highlightDetail: "Comparative Study & Multi-Angle Readout",
            coverColor: "#134E4A",
            accentColor: "#14B8A6",
            rating: 4.8,
          },
          {
            id: "cl-05",
            title: "Holistic Rehabilitation Session",
            author: "Physiotherapy Department",
            category: "Therapy & Rehab",
            format: "45 mins · Motion Lab",
            price: 110,
            isbn: "APT-105",
            stock: 9,
            staffPick: false,
            synopsis: "Targeted physical therapy, biomechanical gait correction, joint mobilization, and guided home rehabilitation routine.",
            highlightTag: "Active Mobility",
            highlightDetail: "Custom Digital Mobility Exercise Program",
            coverColor: "#042F2E",
            accentColor: "#2DD4BF",
            rating: 5,
          },
          {
            id: "cl-06",
            title: "Nutrition & Metabolic Strategy",
            author: "Clinical Dietetics",
            category: "Preventive Care",
            format: "30 mins · Virtual Consult",
            price: 85,
            isbn: "APT-106",
            stock: 12,
            staffPick: false,
            synopsis: "Evidence-based nutritional protocol evaluating micronutrient status, gut microbiome balance, and sustained energy timing.",
            highlightTag: "Nutrition",
            highlightDetail: "Personalized Micronutrient & Meal Framework",
            coverColor: "#0F766E",
            accentColor: "#14B8A6",
            rating: 4.8,
          },
        ],
      };
    }

    // Default universal domain catalog
    const primaryConcept = prompt.split(/[.,;!?]/)[0]?.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, "").trim() || `${brandName} Offerings`;
    const cleanBrand = brandName || "Atelier Studio";

    return {
      domainCategory: "general",
      domainLabel: "Curated Offerings & Works",
      badge: "Signature Collection & Studio Works",
      badgeIcon: "Layers",
      heroTitle: `${cleanBrand} Curated Catalog & Offerings`,
      heroSubtitle: `Explore verified offerings, bespoke services, and signature editions curated for ${cleanBrand}.`,
      itemNoun: "Offering",
      itemNounPlural: "Offerings",
      actionLabel: "Add to Bag",
      cartLabel: "Selected Items",
      searchPlaceholder: "Search offerings, specifications, or categories...",
      emptyTitle: "No Offerings Found",
      emptyDesc: 'No items match your selected filter. Try selecting "All Offerings" or clearing your search.',
      secondaryFeatureLabel: "Specification & Provenance",
      secondaryFeatureKey: "highlightDetail",
      secondaryFeatureIcon: "CheckCircle",
      isPhysicalCover: false,
      theme: {
        bg: "#FAFAF9",
        cardBg: "bg-white",
        cardBorder: "border-stone-200",
        cardBorderHover: "hover:border-stone-400",
        textPrimary: "text-stone-900",
        textSecondary: "text-stone-600",
        fontFamily: "font-sans",
        accent: "#18181B",
        accentSecondary: "#E11D48",
        btnPrimary: "bg-stone-900 text-white hover:bg-stone-800",
        btnCart: "bg-stone-900 text-white hover:bg-stone-800",
        cartBg: "bg-white",
        heroBannerBg: "bg-stone-100/70",
        heroBannerBorder: "border-stone-200",
      },
      products: [
        {
          id: "pr-01",
          title: `${cleanBrand} Signature Edition`,
          author: "Studio Master",
          category: "Signature Tier",
          format: "Primary Offering",
          price: 120,
          isbn: "SIG-01",
          stock: 15,
          staffPick: true,
          synopsis: `The flagship ${primaryConcept} crafted with uncompromising attention to material integrity, function, and aesthetic longevity.`,
          highlightTag: "Flagship",
          highlightDetail: "Hand-finished master series with verified provenance.",
          coverColor: "#18181B",
          accentColor: "#E11D48",
          rating: 5,
        },
        {
          id: "pr-02",
          title: "Artisan Standard Series",
          author: "Lead Workshop",
          category: "Core Collection",
          format: "Standard Tier",
          price: 65,
          isbn: "STD-02",
          stock: 28,
          staffPick: false,
          synopsis: "Essential balance of everyday durability, refined ergonomics, and timeless design built for daily utility.",
          highlightTag: "Bestseller",
          highlightDetail: "Precision-calibrated benchmark construction.",
          coverColor: "#27272A",
          accentColor: "#F43F5E",
          rating: 4.9,
        },
        {
          id: "pr-03",
          title: "Bespoke Archive Reserve",
          author: "Master Craftsman",
          category: "Reserve Tier",
          format: "Limited Edition",
          price: 185,
          isbn: "RES-03",
          stock: 6,
          staffPick: true,
          synopsis: "Strictly limited production run featuring rare raw materials, individual serial engraving, and custom certificate.",
          highlightTag: "Limited Release",
          highlightDetail: "Individually numbered archival release.",
          coverColor: "#09090B",
          accentColor: "#FB7185",
          rating: 5,
        },
        {
          id: "pr-04",
          title: "Companion Care Package",
          author: "Support Atelier",
          category: "Accessories",
          format: "Maintenance Set",
          price: 35,
          isbn: "ACC-04",
          stock: 40,
          staffPick: false,
          synopsis: "Essential preservation accessories, specialized organic treatments, and precision tools for generational upkeep.",
          highlightTag: "Essential",
          highlightDetail: "Comprehensive maintenance and care kit.",
          coverColor: "#3F3F46",
          accentColor: "#E11D48",
          rating: 4.8,
        },
        {
          id: "pr-05",
          title: "Experimental Prototype 05",
          author: "Innovation Lab",
          category: "Lab Editions",
          format: "Pilot Batch",
          price: 95,
          isbn: "EXP-05",
          stock: 10,
          staffPick: false,
          synopsis: "Exploratory iteration testing novel material combinations and progressive ergonomics ahead of general release.",
          highlightTag: "Experimental",
          highlightDetail: "Next-generation material testing series.",
          coverColor: "#1E293B",
          accentColor: "#38BDF8",
          rating: 4.7,
        },
        {
          id: "pr-06",
          title: "Curator's Special Selection",
          author: "Guest Curator",
          category: "Curated Guest",
          format: "Seasonal Special",
          price: 140,
          isbn: "CUR-06",
          stock: 8,
          staffPick: true,
          synopsis: "Seasonal collaboration blending classical craftsmanship with contemporary structural innovation.",
          highlightTag: "Curator Pick",
          highlightDetail: "Limited seasonal partnership release.",
          coverColor: "#1C1917",
          accentColor: "#F59E0B",
          rating: 5,
        },
      ],
    };
  }

  public static generate(options: StorefrontCatalogGeneratorOptions): string {
    const { componentName, brandName, prompt, seed = 42 } = options;
    const catalogConfig = this.deriveDomainCatalog(prompt, brandName);

    const defaultItemsJson = JSON.stringify(catalogConfig.products, null, 2);
    const theme = catalogConfig.theme;

    return `import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  ShoppingBag,
  Star,
  Sprout,
  X,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Filter,
  ArrowRight,
  Heart,
  Bookmark,
  Sparkles,
  Layers,
  CheckCircle,
  Tag
} from "lucide-react";

interface ProductRecord {
  id: string;
  title: string;
  author?: string;
  category: string;
  format?: string;
  price: number;
  isbn?: string;
  stock: number;
  staffPick?: boolean;
  synopsis?: string;
${catalogConfig.domainCategory === "books" ? `  botanicalPairing?: string;\n  botanicalPrice?: number;` : ""}
  highlightTag?: string;
  highlightDetail?: string;
  coverColor?: string;
  accentColor?: string;
  rating?: number;
}

interface CartItem {
  product: ProductRecord;
  quantity: number;
}

const DEFAULT_PRODUCTS: ProductRecord[] = ${defaultItemsJson};

export function ${componentName}(props: any) {
  const navigate = useNavigate();

  // Load authoritative records from props or fall back to domain-adaptive defaults
  const initialProducts = useMemo<ProductRecord[]>(() => {
    try {
      if (Array.isArray(props?.records) && props.records.length > 0) return props.records;
      if (Array.isArray(props?.products) && props.products.length > 0) return props.products;
      if (Array.isArray(props?.items) && props.items.length > 0) return props.items;
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }, [props]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<ProductRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [initialProducts]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter(p => {
        const matchesCat = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          !searchQuery.trim() ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.synopsis && p.synopsis.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (a.staffPick && !b.staffPick) return -1;
        if (!a.staffPick && b.staffPick) return 1;
        return 0;
      });
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  // Cart operations
  const handleAddToCart = (product: ProductRecord) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setToastMessage(\`Added "\${product.title}" to \${"${catalogConfig.cartLabel}"}\`);
    setTimeout(() => setToastMessage(null), 2400);
    if (typeof props?.onAddToCart === "function") {
      props.onAddToCart(product);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: "COMMERCE",
      renderingMode: "standard-dom",
      ready: true,
      cartActive: cart.length > 0,
      itemsRendered: filteredProducts.length,
      interactiveObjects: filteredProducts.length + 4,
      compositionVariant: "editorial_grid",
      structuralFingerprint: "STOREFRONT:top_masthead:curated_catalog_grid",
    };
  }, [filteredProducts, cart]);

  return (
    // __AEGIS_EXPERIENCE__: STOREFRONT_CATALOG
    <div
      className="min-h-screen pb-24 ${theme.fontFamily} ${theme.textPrimary}"
      style={{ backgroundColor: "${theme.bg}" }}
      data-workspace="catalog_grid"
      data-experience="STOREFRONT_CATALOG"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all animate-fade-in text-sm font-sans"
          style={{ backgroundColor: "${theme.accent}" }}
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Header Banner */}
      <section className="border-b ${theme.heroBannerBorder} ${theme.heroBannerBg} px-6 sm:px-12 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-500/10 text-xs tracking-wider uppercase font-sans font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "${theme.accent}" }}></span>
              <span>${catalogConfig.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight ${theme.textPrimary}">
              ${catalogConfig.heroTitle}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed ${theme.textSecondary}">
              ${catalogConfig.heroSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-md active:scale-95"
              style={{ backgroundColor: "${theme.accent}" }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>${catalogConfig.cartLabel}</span>
              {totalCartCount > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-white text-xs font-bold font-sans"
                  style={{ backgroundColor: "${theme.accentSecondary}" }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Rail */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200/40">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={\`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all \${
                    isSelected
                      ? "text-white shadow-sm"
                      : "${theme.cardBg} border ${theme.cardBorder} ${theme.textSecondary} ${theme.cardBorderHover}"
                  }\`}
                  style={isSelected ? { backgroundColor: "${theme.accent}" } : {}}
                >
                  {cat === "all" ? "All ${catalogConfig.itemNounPlural}" : cat}
                </button>
              );
            })}
          </div>

          {/* Search Bar & Sorter */}
          <div className="flex items-center gap-3 w-full md:w-auto font-sans">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="${catalogConfig.searchPlaceholder}"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 ${theme.cardBg} border ${theme.cardBorder} rounded-lg text-xs sm:text-sm ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-1"
                style={{ borderColor: "${theme.accent}33" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 ${theme.cardBg} border ${theme.cardBorder} rounded-lg text-xs ${theme.textPrimary} focus:outline-none"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs ${theme.textSecondary} font-sans">
            Showing <strong className="${theme.textPrimary}">{filteredProducts.length}</strong> ${catalogConfig.domainLabel.toLowerCase()}
          </p>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold hover:underline"
              style={{ color: "${theme.accentSecondary}" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8">
            <Layers className="w-12 h-12 opacity-40 mx-auto mb-3" />
            <h3 className="text-lg font-bold ${theme.textPrimary}">${catalogConfig.emptyTitle}</h3>
            <p className="text-sm ${theme.textSecondary} mt-1 max-w-sm mx-auto">
              ${catalogConfig.emptyDesc}
            </p>
            <button
              type="button"
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="mt-4 px-4 py-2 rounded-lg text-white text-xs font-semibold"
              style={{ backgroundColor: "${theme.accent}" }}
            >
              Reset Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => {
              const bg = product.coverColor || "${theme.accent}";

              return (
                <article
                  key={product.id}
                  className="group ${theme.cardBg} border ${theme.cardBorder} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                >
                  {/* Card Cover Header */}
                  <div
                    onClick={() => setInspectedProduct(product)}
                    className="relative cursor-pointer p-6 flex items-center justify-center min-h-[220px] overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
                    style={{
                      background: \`linear-gradient(135deg, \${bg}ee 0%, \${bg} 100%)\`,
                    }}
                  >
                    ${catalogConfig.isPhysicalCover ? `<div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />` : ""}

                    {/* Staff Pick / Ribbon */}
                    {product.staffPick && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 text-[11px] font-bold shadow-sm font-sans">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Featured</span>
                      </div>
                    )}

                    <div className="text-center text-white px-4 py-6 max-w-xs space-y-2 drop-shadow-sm">
                      <span className="text-[10px] tracking-widest uppercase font-mono text-white/80 block">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-lg sm:text-xl leading-snug tracking-tight text-white line-clamp-2">
                        {product.title}
                      </h3>
                      {product.author && (
                        <p className="text-xs text-white/90 font-serif italic">
                          {product.author}
                        </p>
                      )}
                      {product.format && (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] bg-white/20 backdrop-blur-xs font-mono font-medium mt-1">
                          {product.format}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-[11px] uppercase tracking-wider font-semibold" style={{ color: "${theme.accentSecondary}" }}>
                          {product.category}
                        </span>
                        <span className="font-bold text-base ${theme.textPrimary}">
                          \${product.price.toFixed(2)}
                        </span>
                      </div>

                      <h4
                        onClick={() => setInspectedProduct(product)}
                        className="font-bold text-base ${theme.textPrimary} cursor-pointer hover:underline line-clamp-1"
                      >
                        {product.title}
                      </h4>

                      {product.synopsis && (
                        <p className="text-xs ${theme.textSecondary} mt-2 line-clamp-2 leading-relaxed">
                          {product.synopsis}
                        </p>
                      )}

                      {/* Domain Complement / Highlight Feature */}
${catalogConfig.domainCategory === "books" ? `                      {product.botanicalPairing && (
                        <div className="mt-3.5 p-2.5 rounded-xl bg-stone-500/5 border border-stone-500/10 flex items-center gap-2 text-xs">
                          <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="${theme.textSecondary} truncate">
                            <strong className="${theme.textPrimary}">Pairing:</strong> {product.botanicalPairing}
                          </span>
                        </div>
                      )}` : `                      {product.highlightDetail && (
                        <div className="mt-3.5 p-2.5 rounded-xl bg-stone-500/5 border border-stone-500/10 flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="${theme.textSecondary} truncate">
                            {product.highlightDetail}
                          </span>
                        </div>
                      )}`}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center gap-2 border-t border-stone-200/40 font-sans">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-98 transition-all shadow-sm"
                        style={{ backgroundColor: "${theme.accent}" }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>${catalogConfig.actionLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectedProduct(product)}
                        className="px-3 py-2.5 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.textPrimary} text-xs hover:bg-stone-500/5 transition-colors font-medium"
                        title="View Full Details"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Inspect Product Modal */}
      {inspectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="${theme.cardBg} border ${theme.cardBorder} rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <button
              type="button"
              onClick={() => setInspectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full ${theme.cardBg} border ${theme.cardBorder} ${theme.textPrimary} hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              <div
                className="w-full sm:w-48 aspect-[2/3] rounded-xl flex items-center justify-center text-white p-4 shadow-xl shrink-0"
                style={{ background: inspectedProduct.coverColor || "${theme.accent}" }}
              >
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/70 block">
                    {inspectedProduct.category}
                  </span>
                  <h4 className="font-bold text-sm leading-snug text-white">
                    {inspectedProduct.title}
                  </h4>
                  {inspectedProduct.author && (
                    <p className="text-xs text-white/80">{inspectedProduct.author}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "${theme.accentSecondary}" }}>
                    {inspectedProduct.category}
                  </span>
                  <h3 className="text-2xl font-bold ${theme.textPrimary}">
                    {inspectedProduct.title}
                  </h3>
                  {inspectedProduct.author && (
                    <p className="text-sm ${theme.textSecondary} mt-0.5">by {inspectedProduct.author}</p>
                  )}
                  <div className="text-xl font-bold mt-2" style={{ color: "${theme.accent}" }}>
                    \${inspectedProduct.price.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2 text-xs ${theme.textSecondary} leading-relaxed">
                  <p>{inspectedProduct.synopsis}</p>
                </div>

${catalogConfig.domainCategory === "books" ? `                {inspectedProduct.botanicalPairing && (
                  <div className="p-3 bg-stone-500/5 border border-stone-500/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold ${theme.textPrimary}">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended Living Botanical Complement</span>
                    </div>
                    <p className="text-xs ${theme.textSecondary}">
                      {inspectedProduct.botanicalPairing}
                      {inspectedProduct.botanicalPrice ? \` — \\\$\${inspectedProduct.botanicalPrice.toFixed(2)}\` : ""}
                    </p>
                  </div>
                )}` : `                {inspectedProduct.highlightDetail && (
                  <div className="p-3 bg-stone-500/5 border border-stone-500/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold ${theme.textPrimary}">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>${catalogConfig.secondaryFeatureLabel}</span>
                    </div>
                    <p className="text-xs ${theme.textSecondary}">
                      {inspectedProduct.highlightDetail}
                    </p>
                  </div>
                )}`}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(inspectedProduct);
                      setInspectedProduct(null);
                    }}
                    className="flex-1 py-3 px-5 rounded-xl text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: "${theme.accent}" }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>${catalogConfig.actionLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedProduct(null)}
                    className="py-3 px-4 rounded-xl border ${theme.cardBorder} text-xs ${theme.textPrimary} hover:bg-stone-500/5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Cart / Booking Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-fade-in flex justify-end font-sans">
          <div className="w-full max-w-md ${theme.cardBg} h-full shadow-2xl border-l ${theme.cardBorder} flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/40">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" style={{ color: "${theme.accent}" }} />
                  <h3 className="font-bold text-lg ${theme.textPrimary}">${catalogConfig.cartLabel}</h3>
                  <span className="text-xs ${theme.textSecondary}">({totalCartCount} items)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-500/10 ${theme.textPrimary}"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Item List */}
              <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 ${theme.textSecondary} space-y-2">
                    <ShoppingBag className="w-10 h-10 opacity-30 mx-auto" />
                    <p className="text-sm">Your ${catalogConfig.cartLabel.toLowerCase()} is currently empty.</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs underline font-semibold mt-2"
                      style={{ color: "${theme.accent}" }}
                    >
                      Browse the catalog
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-3.5 ${theme.cardBg} border ${theme.cardBorder} rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm ${theme.textPrimary} truncate">
                          {product.title}
                        </h4>
                        <p className="text-xs ${theme.textSecondary}">
                          \${product.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          className="w-7 h-7 rounded-md bg-stone-500/10 border ${theme.cardBorder} flex items-center justify-center ${theme.textPrimary} hover:opacity-80"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono w-4 text-center ${theme.textPrimary}">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                          className="w-7 h-7 rounded-md bg-stone-500/10 border ${theme.cardBorder} flex items-center justify-center ${theme.textPrimary} hover:opacity-80"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <span className="font-bold text-sm ${theme.textPrimary}">
                          \${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-stone-200/40 space-y-4">
                <div className="space-y-1.5 text-xs ${theme.textSecondary}">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold ${theme.textPrimary}">\${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing / Shipping</span>
                    <span>{cartTotal > 40 ? "Complimentary" : "$4.50"}</span>
                  </div>
                </div>

                <div className="flex justify-between text-base font-bold ${theme.textPrimary} pt-2 border-t border-stone-200/40">
                  <span>Total Due</span>
                  <span>\${(cartTotal > 40 ? cartTotal : cartTotal + 4.5).toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/complete-checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md text-center"
                    style={{ backgroundColor: "${theme.accent}" }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ${componentName};
`;
  }
}
