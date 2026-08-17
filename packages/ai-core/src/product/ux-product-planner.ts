/**
 * UXProductPlanner
 *
 * Converts product requirements into structured UX plans with pages, navigation,
 * components, and UI states (loading, empty, success, error, validation, disabled).
 */

import type { ProductSpecification } from "./product-requirement-analyzer.js";

export interface PageDefinition {
  id: string;
  title: string;
  route: string;
  components: string[];
  states: Array<"loading" | "empty" | "success" | "error" | "validation" | "disabled">;
}

export interface UXProductPlan {
  pages: PageDefinition[];
  navigation: Array<{ label: string; route: string }>;
  summary: string;
}

export class UXProductPlanner {
  public static plan(spec: ProductSpecification): UXProductPlan {
    const pages: PageDefinition[] = [
      {
        id: "page_dashboard",
        title: "Dashboard",
        route: "/",
        components: ["DashboardOverview", "StatsWidget", "RecentActivity"],
        states: ["loading", "empty", "success", "error"],
      },
    ];

    const navigation = [{ label: "Dashboard", route: "/" }];

    for (const feature of spec.features) {
      if (feature === "auth") continue;
      const title = feature.charAt(0).toUpperCase() + feature.slice(1);
      const route = `/${feature}`;

      pages.push({
        id: `page_${feature}`,
        title,
        route,
        components: [`${title}List`, `${title}Form`, `${title}Card`],
        states: ["loading", "empty", "success", "error", "validation", "disabled"],
      });

      navigation.push({ label: title, route });
    }

    return {
      pages,
      navigation,
      summary: `Planned ${pages.length} pages and ${navigation.length} navigation items covering all ${spec.features.length} features.`,
    };
  }
}
