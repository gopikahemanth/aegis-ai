/**
 * ProductDiscoveryAgent
 *
 * Discovers real-world domain requirements, core user flows, standard operational features,
 * run-to-run differentiator features, and data models before planning or coding.
 *
 * Replaces naive keyword guessing with domain-expert product discovery.
 * Includes non-blocking fallback if LLM is unreachable or returns malformed JSON.
 */

import { BaseAgent } from "./base-agent.js";
import type { ProductCharacteristics } from "../design/product-understanding.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import { createHash } from "node:crypto";

export interface FeatureSpec {
  name: string;
  description: string;
  requiredComponents: string[];
  requiredDataFields?: string[];
}

export interface DataModelSpec {
  name: string;
  fields: string[];
  relations?: string[];
}

export interface FeatureMatrix {
  category: string;
  /**
   * ADVISORY ONLY — not consumed by the design pipeline downstream.
   *
   * CapabilityPlanner.fromFeatureMatrix() and CapabilityPlanner.plan() both read
   * `characteristics.experiencePattern` (from ProductUnderstanding.analyze()), NOT this field.
   * This value is returned by the LLM and by deterministic fallbacks as context/debugging aid,
   * but has zero effect on which PAGE_TEMPLATE, CompositionFamily, or hero element is selected.
   *
   * The sole source of truth for experience pattern throughout the design pipeline is:
   *   ProductUnderstanding.analyze(prompt).experiencePattern
   */
  experiencePattern?: ProductCharacteristics["experiencePattern"];
  /** Authoritative primary landing feature designated for root "/" landing experience */
  primaryLandingFeature?: string;
  corePages: string[];
  standardFeatures: FeatureSpec[];
  differentiatorFeatures: FeatureSpec[]; // 2-3 features unique to THIS generation run
  dataModels: DataModelSpec[];
  isFallback?: boolean;
}


export class ProductDiscoveryAgent extends BaseAgent {
  readonly name = "Product Discovery Agent";
  private readonly jsonExtractor = new JsonExtractor();

  /**
   * Executes domain discovery using the LLM with safe fallback.
   */
  async discover(
    prompt: string,
    characteristics: ProductCharacteristics,
    seedOverride?: string
  ): Promise<FeatureMatrix> {
    const runSeed = seedOverride || createHash("sha256").update(`${prompt}_${Date.now()}`).digest("hex").slice(0, 8);

    try {
      const discoveryPrompt = this.buildPrompt(prompt, characteristics, runSeed);
      const response = await this.provider.chat([
        {
          role: "system",
          content: `You are a Principal Product Architect and Industry Domain Expert.
Your job is to analyze business requests and define what a real-world, production business in that category actually requires to operate successfully.
Reason from first principles about customer journeys, operational workflows, and domain realities.
NEVER provide generic filler. Provide concrete, domain-specific features and entities.
Return ONLY a valid, parseable JSON object matching the requested schema. No markdown backticks, no commentary.`
        },
        {
          role: "user",
          content: discoveryPrompt
        }
      ], {
        temperature: 0.4,
        maxTokens: 3000,
        agentType: "discovery",
        complexity: 8,
      } as any);

      const extractedJson = this.jsonExtractor.extract(response);
      const parsed = JSON.parse(extractedJson) as FeatureMatrix;

      if (this.isValidFeatureMatrix(parsed)) {
        parsed.isFallback = false;
        console.log(`[ProductDiscovery] ✓ Discovered category "${parsed.category}" with ${parsed.standardFeatures.length} standard & ${parsed.differentiatorFeatures.length} differentiator features.`);
        return parsed;
      }

      console.warn("[ProductDiscovery] ⚠️ Discovery output failed schema validation. Falling back to deterministic domain matrix.");
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    } catch (err: any) {
      console.warn(`[ProductDiscovery] ⚠️ Discovery agent failed: ${err.message}. Using non-blocking domain fallback.`);
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    }
  }

  private buildPrompt(prompt: string, characteristics: ProductCharacteristics, runSeed: string): string {
    return `
BUSINESS INITIATIVE / PROMPT: "${prompt}"

PRODUCT CONTEXT (from ProductUnderstanding):
- Experience Pattern: ${characteristics.experiencePattern}
- Primary Activity: ${characteristics.primaryActivity}
- Emotional Tone: ${characteristics.emotionalTone.primary}
- Audience: ${characteristics.targetAudience || "General customers"}
- Run Seed: ${runSeed}

TASK:
Produce a comprehensive, domain-accurate FeatureMatrix for this product.
Do not simply echo the user's words. Reason as an industry expert: what does a business of this type actually require to serve customers and operate?

REQUIREMENTS:
1. "category": Concise industry label (e.g. "Luxury Hospitality & Resort", "Automotive Detailing & Wash", "SaaS Engineering Project Management", "Artisan Bakery & Confectionery", "Consumer E-Commerce & Retail Marketplace").
2. "experiencePattern": Select the single most accurate UX macro-pattern for this domain:
   - "storefront-commerce": Retail shopping, marketplaces, e-commerce, consumer store with promotional banners, product catalog grid, and shopping cart
   - "hospitality-portal": Luxury resorts, hotels, vacation stays, retreats, villas with immersive booking bar
   - "catalog-browser": Curated discovery listings, libraries, galleries
   - "booking-flow": Appointment scheduling, service bookings, reservations
   - "operations-dashboard": Operational monitoring, KPIs, business analytics, internal management
   - "workspace-editor": Document, media, or creative authoring canvas
   - "personal-tracker": Personal habit, wellness, mood, or longitudinal health tracking
   - "configurator-workspace": Engineering/industrial design, photometrics, physical parameter configurator
3. "primaryLandingFeature": The name of the single core feature or page that serves as the primary home landing experience ("/") for end users (e.g. for a school/edtech: "Course Catalog", for freight logistics: "Dispatch Log", for bakery: "Daily Fresh Bread Menu", for portfolio: "Project Showcase"). It must be an active, primary user workflow, NEVER an administrative, utility, export, or secondary page.
4. "corePages": 3-6 route names with leading slash (e.g. ["/", "/deals", "/categories", "/cart"]).
5. "standardFeatures": 4-6 essential operational features (e.g. for car wash: package comparison, vehicle size selector, appointment scheduler, add-on selector, location & bay tracker).
6. "differentiatorFeatures": Exactly 2-3 innovative or unique features that set THIS specific product apart from competitors (incorporate seed: ${runSeed} for variety). E.g. For a resort: "Sommelier Cellar Booking", "Sunset Yacht Concierge"; for a bakery: "Weekly Sourdough Subscription", "Custom Cake 3D Builder".
7. "dataModels": 3-5 core business entities with realistic domain fields and relations.

SCHEMA SPECIFICATION (JSON ONLY):
{
  "category": string,
  "experiencePattern": "storefront-commerce" | "hospitality-portal" | "catalog-browser" | "booking-flow" | "operations-dashboard" | "workspace-editor" | "personal-tracker" | "configurator-workspace",
  "primaryLandingFeature": string,
  "corePages": string[],
  "standardFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "differentiatorFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": string[],
      "relations": string[]
    }
  ]
}
`.trim();
  }

  private isValidFeatureMatrix(data: any): data is FeatureMatrix {
    if (
      typeof data === "object" &&
      data !== null &&
      typeof data.category === "string" &&
      Array.isArray(data.corePages) &&
      data.corePages.length >= 2 &&
      Array.isArray(data.standardFeatures) &&
      data.standardFeatures.length >= 2 &&
      Array.isArray(data.differentiatorFeatures) &&
      data.differentiatorFeatures.length >= 1 &&
      Array.isArray(data.dataModels) &&
      data.dataModels.length >= 1
    ) {
      if (!data.primaryLandingFeature || typeof data.primaryLandingFeature !== "string") {
        data.primaryLandingFeature = data.standardFeatures[0]?.name || "Home";
      }
      return true;
    }
    return false;
  }

  /**
   * Deterministically select differentiator features from a category pool using the seed hash.
   * Guarantees 2-3 distinct features per run and variation across different seeds.
   */
  private selectDifferentiators(pool: FeatureSpec[], seed: string, count: number = 2): FeatureSpec[] {
    const hashHex = createHash("sha256").update(seed || "default_seed").digest("hex");
    const val1 = parseInt(hashHex.slice(0, 4), 16);
    const val2 = parseInt(hashHex.slice(4, 8), 16);
    const val3 = parseInt(hashHex.slice(8, 12), 16);

    const available = [...pool];
    const result: FeatureSpec[] = [];
    const vals = [val1, val2, val3];
    const takeCount = Math.min(count, available.length);

    for (let i = 0; i < takeCount; i++) {
      const idx = vals[i] % available.length;
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  }

  /**
   * Deterministic domain fallback ensuring the pipeline never blocks if the LLM call fails.
   */
  public fallback(prompt: string, characteristics: ProductCharacteristics, seed: string): FeatureMatrix {
    const p = prompt.toLowerCase();
    const s = seed || prompt;

    // 1. Hospitality / Resort / Hotel
    if (p.includes("resort") || p.includes("hotel") || p.includes("hospitality") || p.includes("villa") || p.includes("vacation")) {
      const resortDifferentiators: FeatureSpec[] = [
        {
          name: "Private Concierge Excursion Booking",
          description: "Curated island yacht tours and helicopter transfers.",
          requiredComponents: ["ExcursionPlanner", "ConciergeRequestForm"],
          requiredDataFields: ["activityTitle", "duration", "guideName", "price"],
        },
        {
          name: "Holistic Wellness & Spa Sanctuary",
          description: "Signature treatment booking with therapist specialization.",
          requiredComponents: ["SpaTreatmentMenu", "TherapistSelector"],
          requiredDataFields: ["treatmentName", "durationMinutes", "focusArea"],
        },
        {
          name: "Sommelier Sunset Cellar Tasting",
          description: "Private vintage cellar reservation with master sommelier pairings.",
          requiredComponents: ["WineTastingCard", "SommelierBookingModal"],
          requiredDataFields: ["vintageYear", "sommelierName", "tastingTier"],
        },
        {
          name: "Bespoke Starlight Beach Dining",
          description: "Exclusive private beach dinner with custom chef menu.",
          requiredComponents: ["PrivateDiningCard", "CourseCustomizer"],
          requiredDataFields: ["locationSlot", "chefSpecialty", "guestCount"],
        },
      ];

      return {
        category: "Luxury Hospitality & Resort",
        experiencePattern: "hospitality-portal",
        primaryLandingFeature: "Villa & Suite Showcase",
        corePages: ["/", "/villas", "/experiences", "/dining", "/reservations"],
        standardFeatures: [
          {
            name: "Villa & Suite Showcase",
            description: "Room selection with amenity tags, occupancy limits, and square footage details.",
            requiredComponents: ["VillaCardGrid", "AmenityFilter", "RoomDetailDrawer"],
            requiredDataFields: ["name", "pricePerNight", "capacity", "sqFt", "amenities", "viewType"],
          },
          {
            name: "Multi-Step Reservation Flow",
            description: "Date-range picker, guest count selection, and room availability check.",
            requiredComponents: ["DateRangePicker", "GuestSelector", "BookingSummaryCard"],
            requiredDataFields: ["checkIn", "checkOut", "guests", "selectedVillaId", "totalCost"],
          },
          {
            name: "Culinary & Dining Guide",
            description: "On-site restaurant menus, chef tasting notes, and table reservation request.",
            requiredComponents: ["RestaurantCard", "MenuViewer", "TableReservationModal"],
            requiredDataFields: ["restaurantName", "cuisine", "hours", "reservationSlot"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(resortDifferentiators, s, 2),
        dataModels: [
          { name: "Accommodation", fields: ["id", "title", "tier", "pricePerNight", "maxGuests", "isAvailable"] },
          { name: "Reservation", fields: ["id", "guestName", "checkIn", "checkOut", "totalAmount", "status"] },
          { name: "Experience", fields: ["id", "title", "durationHours", "price", "category"] },
        ],
      };
    }

    // 2. Automotive / Car Wash / Detailing
    if (p.includes("wash") || p.includes("car") || p.includes("detail") || p.includes("auto") || p.includes("vehicle")) {
      const carWashDifferentiators: FeatureSpec[] = [
        {
          name: "Live Bay Progress Tracker",
          description: "Real-time wash status updates (Pre-soak, Hand Wash, Ceramic Coating, QC).",
          requiredComponents: ["BayStatusMeter", "LiveTimelineView"],
          requiredDataFields: ["ticketNumber", "currentStage", "estimatedCompletion"],
        },
        {
          name: "Unlimited Wash Club Subscription",
          description: "Monthly membership pass with license plate recognition pass.",
          requiredComponents: ["MembershipTierCard", "LicensePlateInput"],
          requiredDataFields: ["plateNumber", "tier", "billingCycle"],
        },
        {
          name: "Ceramic Coating Hydrophobic Inspection",
          description: "Optical gloss rating and paint sealant longevity meter.",
          requiredComponents: ["GlossMeterCard", "PaintInspectionDiagram"],
          requiredDataFields: ["glossReading", "coatWarrantyMonths", "paintCondition"],
        },
        {
          name: "Fleet Corporate Detailing Portal",
          description: "Multi-vehicle commercial account scheduling and consolidated billing.",
          requiredComponents: ["FleetOverviewTable", "BulkSchedulerModal"],
          requiredDataFields: ["fleetId", "vehicleCount", "monthlyRate"],
        },
        {
          name: "Touchless Express Lane RFID Check-In",
          description: "Automated gate sensor check-in with stored wash profile preferences.",
          requiredComponents: ["ExpressLaneCard", "RfidSensorSimulator"],
          requiredDataFields: ["tagId", "washProfile", "gateStatus"],
        },
      ];

      return {
        category: "Automotive Detailing & Care",
        experiencePattern: "booking-flow",
        primaryLandingFeature: "Service Tier Comparison",
        corePages: ["/", "/services", "/booking", "/locations", "/membership"],
        standardFeatures: [
          {
            name: "Service Tier Comparison",
            description: "Transparent breakdown of Express, Deluxe, and Ceramic detailing packages.",
            requiredComponents: ["PricingMatrix", "FeatureChecklist", "VehicleTypeSelector"],
            requiredDataFields: ["packageName", "price", "durationMinutes", "includedServices"],
          },
          {
            name: "Vehicle Size & Condition Selector",
            description: "Sedan, SUV, Truck pricing adjustments and paint condition assessment.",
            requiredComponents: ["VehicleClassTabs", "ConditionAddOnToggle"],
            requiredDataFields: ["vehicleType", "surcharge", "notes"],
          },
          {
            name: "Time-Slot Appointment Scheduler",
            description: "Bay availability schedule with instant confirmation.",
            requiredComponents: ["TimeSlotPicker", "AppointmentConfirmationCard"],
            requiredDataFields: ["dateTime", "bayNumber", "technician", "customerPhone"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(carWashDifferentiators, s, 2),
        dataModels: [
          { name: "ServicePackage", fields: ["id", "name", "basePrice", "durationMinutes", "features"] },
          { name: "Appointment", fields: ["id", "customerName", "vehiclePlate", "scheduledAt", "status"] },
          { name: "Membership", fields: ["id", "memberId", "planTier", "active"] },
        ],
      };
    }

    // 3. SaaS / Project Management / Engineering
    if (p.includes("saas") || p.includes("project") || p.includes("task") || p.includes("sprint") || p.includes("board")) {
      const saasDifferentiators: FeatureSpec[] = [
        {
          name: "Automated PR Blast-Radius Risk Score",
          description: "Evaluates dependency blast radius and code complexity before merging.",
          requiredComponents: ["BlastRadiusBadge", "RiskAnalysisDrawer"],
          requiredDataFields: ["riskLevel", "affectedComponents", "testCoverage"],
        },
        {
          name: "AI Standup & Blocker Digest",
          description: "Synthesizes daily activity into clear executive highlights.",
          requiredComponents: ["StandupDigestCard", "BlockerAlertList"],
          requiredDataFields: ["summaryText", "blockersDetected", "timestamp"],
        },
        {
          name: "Real-Time Sprint Velocity Simulator",
          description: "Monte Carlo delivery forecast based on team historical story-point throughput.",
          requiredComponents: ["VelocitySimulatorChart", "ForecastSlider"],
          requiredDataFields: ["simulatedConfidence", "projectedDeliveryDate"],
        },
        {
          name: "Cross-Service Dependency Heatmap",
          description: "Interactive visual matrix of inter-team API blockers and milestones.",
          requiredComponents: ["DependencyMatrixView", "BlockerConnector"],
          requiredDataFields: ["serviceSource", "serviceTarget", "isBlocking"],
        },
      ];

      return {
        category: "SaaS Project & Sprint Workspace",
        experiencePattern: "operations-dashboard",
        primaryLandingFeature: "Sprint Backlog & Task Management",
        corePages: ["/", "/sprints", "/backlog", "/roadmap", "/analytics"],
        standardFeatures: [
          {
            name: "Sprint Backlog & Task Management",
            description: "Prioritized task list with story points, assignees, and status tags.",
            requiredComponents: ["TaskListView", "StatusFilterBar", "NewTaskModal"],
            requiredDataFields: ["title", "status", "points", "assignee", "priority"],
          },
          {
            name: "Interactive Workflow Board",
            description: "Drag/column state transitions (To Do, In Progress, Code Review, Done).",
            requiredComponents: ["WorkflowColumns", "TaskCard", "DetailInspector"],
            requiredDataFields: ["cardId", "columnId", "tags", "dueDate"],
          },
          {
            name: "Velocity & Burn-down Analytics",
            description: "Sprint burn-down metrics and completion percentage tracking.",
            requiredComponents: ["VelocityChart", "MetricKpiRow"],
            requiredDataFields: ["sprintNumber", "plannedPoints", "completedPoints"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(saasDifferentiators, s, 2),
        dataModels: [
          { name: "TaskItem", fields: ["id", "title", "description", "status", "priority", "points"] },
          { name: "Sprint", fields: ["id", "name", "startDate", "endDate", "isActive"] },
          { name: "TeamMember", fields: ["id", "name", "email", "role"] },
        ],
      };
    }

    // 4. Bakery / Food / Restaurant
    if (p.includes("bakery") || p.includes("bread") || p.includes("cake") || p.includes("pastry") || p.includes("food") || p.includes("coffee")) {
      const bakeryDifferentiators: FeatureSpec[] = [
        {
          name: "Interactive Custom Cake Studio",
          description: "Multi-tier flavor, frosting, filling, and decorative inscription builder.",
          requiredComponents: ["CakeTierConfigurator", "FrostingPaletteSelector", "QuoteCalculator"],
          requiredDataFields: ["tierCount", "flavor", "filling", "inscriptionText", "estimatedPrice"],
        },
        {
          name: "Sourdough Starter & Sourcing Journal",
          description: "Heritage grain farm provenance and starter age chronicle.",
          requiredComponents: ["GrainProvenanceMap", "FermentationTimeline"],
          requiredDataFields: ["grainOrigin", "fermentationHours", "batchNumber"],
        },
        {
          name: "Weekly Artisan Loaf Bread Subscription",
          description: "Automated recurring warm loaf deliveries with baker's choice rotation.",
          requiredComponents: ["SubscriptionPlanCard", "LoafPreferenceSelector"],
          requiredDataFields: ["frequency", "selectedLoafTypes", "deliveryDay"],
        },
        {
          name: "Patisserie Masterclass Tasting Workshop",
          description: "Hands-on croissant lamination and sourdough workshop booking.",
          requiredComponents: ["WorkshopCard", "SeatReservationModal"],
          requiredDataFields: ["classTitle", "availableSeats", "instructorName"],
        },
      ];

      return {
        category: "Artisan Bakery & Patisserie",
        experiencePattern: characteristics?.experiencePattern || "booking-flow",
        primaryLandingFeature: "Daily Fresh Bread & Pastry Catalog",
        corePages: ["/", "/menu", "/custom-cakes", "/catering", "/about"],
        standardFeatures: [
          {
            name: "Daily Fresh Bread & Pastry Catalog",
            description: "Morning bake list with real-time in-stock and sold-out badges.",
            requiredComponents: ["BakeCatalogGrid", "DietaryFilterChips", "StockStatusBadge"],
            requiredDataFields: ["itemTitle", "price", "dietaryTags", "flourType", "inStock"],
          },
          {
            name: "Order Ahead & Curbside Pickup",
            description: "Time-selection for warm loaf pickup and order assembly.",
            requiredComponents: ["PickupTimeSelector", "CartDrawer"],
            requiredDataFields: ["orderItems", "pickupTime", "customerName", "subtotal"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(bakeryDifferentiators, s, 2),
        dataModels: [
          { name: "BakedGood", fields: ["id", "title", "price", "category", "inStock", "allergens"] },
          { name: "CustomOrder", fields: ["id", "customerName", "eventDate", "details", "priceQuote"] },
          { name: "PickupSlot", fields: ["id", "time", "availableSlots"] },
        ],
      };
    }

    // 5. Retail / E-Commerce / Marketplace
    if (p.includes("retail") || p.includes("shop") || p.includes("market") || p.includes("ecommerce") || p.includes("e-commerce") || p.includes("store")) {
      const retailDifferentiators: FeatureSpec[] = [
        {
          name: "Lightning Flash Deal Countdown & Stock Meter",
          description: "Live countdown timer with real-time stock claim progress bar.",
          requiredComponents: ["CountdownTimer", "StockClaimProgress", "FlashSaleBadge"],
          requiredDataFields: ["endsAt", "claimedPercent", "discountPercent"],
        },
        {
          name: "Interactive Slide-Out Shopping Cart Drawer",
          description: "Persistent cart drawer with instant quantity increment and order summary.",
          requiredComponents: ["CartDrawer", "CartItemRow", "PriceSummary"],
          requiredDataFields: ["cartItems", "itemCount", "orderTotal"],
        },
        {
          name: "Delivery Courier Serviceability Checker",
          description: "Instant pincode verification with estimated delivery date calculation.",
          requiredComponents: ["PincodeInput", "EstimatedDeliveryBadge"],
          requiredDataFields: ["pincode", "isAvailable", "deliveryDays"],
        },
      ];

      return {
        category: "Consumer E-Commerce & Retail Marketplace",
        experiencePattern: "storefront-commerce",
        primaryLandingFeature: "Product Catalog Grid with Discounts",
        corePages: ["/", "/deals", "/categories", "/cart"],
        standardFeatures: [
          {
            name: "Promotional Banner Carousel",
            description: "High-impact seasonal campaign carousel with shop now CTA.",
            requiredComponents: ["BannerCarousel", "HeroSlide", "PromotionBadge"],
            requiredDataFields: ["bannerTitle", "promoTag", "imageUrl", "ctaLink"],
          },
          {
            name: "Top Category Quick-Nav Row",
            description: "Horizontal icon row for instant department filtering.",
            requiredComponents: ["CategoryIconRow", "CategoryPill"],
            requiredDataFields: ["name", "iconName", "productCount"],
          },
          {
            name: "Product Catalog Grid with Discounts",
            description: "Card grid showing star ratings, strike-through prices, and discount badges.",
            requiredComponents: ["ProductCard", "StarRating", "DiscountBadge", "AddToCartButton"],
            requiredDataFields: ["title", "rating", "price", "strikePrice", "discountPercentage"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(retailDifferentiators, s, 2),
        dataModels: [
          { name: "Product", fields: ["id", "title", "price", "strikePrice", "discountPercentage", "rating", "category", "inStock"] },
          { name: "CartItem", fields: ["id", "productId", "quantity", "unitPrice"] },
          { name: "Order", fields: ["id", "orderNumber", "totalAmount", "status", "shippingPincode"] },
        ],
      };
    }

    // 6. Default General Business
    const generalDifferentiators: FeatureSpec[] = [
      {
        name: "Interactive Real-Time Cost Estimator",
        description: "Dynamic pricing calculator updating as parameters are adjusted.",
        requiredComponents: ["CostEstimatorSlider", "QuoteBreakdownCard"],
        requiredDataFields: ["parameters", "calculatedTotal", "tierLevel"],
      },
      {
        name: "Client Verification & Satisfaction Guarantee",
        description: "Transparent guarantee metrics with verified client satisfaction ratings.",
        requiredComponents: ["GuaranteeBadge", "MetricProgressRing"],
        requiredDataFields: ["satisfactionScore", "guaranteeText"],
      },
      {
        name: "Priority Service SLA Express Queue",
        description: "Expedited turnaround tracking with guaranteed SLA response timestamps.",
        requiredComponents: ["SlaStatusTracker", "UrgencyBadge"],
        requiredDataFields: ["slaHours", "priorityLevel"],
      },
    ];

    return {
      category: "Digital Business Platform",
      experiencePattern: characteristics.experiencePattern || "operations-dashboard",
      primaryLandingFeature: "Interactive Service & Offer Catalog",
      corePages: ["/", "/services", "/catalog", "/about", "/contact"],
      standardFeatures: [
        {
          name: "Interactive Service & Offer Catalog",
          description: "Searchable, filterable list of products or services with pricing and details.",
          requiredComponents: ["CatalogGrid", "CategoryTabs", "ItemDetailModal"],
          requiredDataFields: ["title", "category", "price", "description"],
        },
        {
          name: "Direct Client Inquiry & Booking Flow",
          description: "Structured form with instant validation and response timeline.",
          requiredComponents: ["ContactForm", "ConfirmationNotice"],
          requiredDataFields: ["name", "email", "serviceRequested", "message"],
        },
      ],
      differentiatorFeatures: this.selectDifferentiators(generalDifferentiators, s, 2),
      dataModels: [
        { name: "ProductService", fields: ["id", "title", "price", "category", "description"] },
        { name: "Inquiry", fields: ["id", "clientName", "clientEmail", "status", "submittedAt"] },
      ],
    };
  }
}
