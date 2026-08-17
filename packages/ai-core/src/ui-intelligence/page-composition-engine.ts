/**
 * PageCompositionEngine
 *
 * Formulates hierarchical layout structures for individual pages:
 * Headers, Sidebars, Hero sections, KPI cards, Data grids, Modals, Forms, and Footers.
 */

import { type PageNode } from "./ux-architecture-engine.js";

export interface PageSection {
  sectionId: string;
  name: string;
  componentType: "HERO" | "KPI_GRID" | "DATA_TABLE" | "FORM_CONTAINER" | "NAVIGATION_BAR" | "FOOTER" | "ACTIVITY_FEED";
  gridSpan: number; // 1 to 12
  props: Record<string, any>;
}

export interface ComposedPageLayout {
  pageId: string;
  title: string;
  path: string;
  layoutStructure: "APP_SHELL" | "CENTERED_CONTAINER" | "FULL_WIDTH_LANDING";
  sections: PageSection[];
}

export class PageCompositionEngine {
  public static composePage(page: PageNode): ComposedPageLayout {
    const sections: PageSection[] = [];

    if (page.layoutType === "LANDING") {
      sections.push(
        { sectionId: "sec_hero", name: "Hero Value Proposition", componentType: "HERO", gridSpan: 12, props: { hasCta: true } },
        { sectionId: "sec_kpi", name: "Feature Highlights", componentType: "KPI_GRID", gridSpan: 12, props: { columns: 3 } },
        { sectionId: "sec_footer", name: "Site Footer", componentType: "FOOTER", gridSpan: 12, props: { linksCount: 6 } }
      );
      return {
        pageId: page.id,
        title: page.title,
        path: page.path,
        layoutStructure: "FULL_WIDTH_LANDING",
        sections,
      };
    }

    if (page.layoutType === "DASHBOARD") {
      sections.push(
        { sectionId: "sec_nav", name: "Top Header Bar", componentType: "NAVIGATION_BAR", gridSpan: 12, props: {} },
        { sectionId: "sec_kpis", name: "Executive KPI Cards", componentType: "KPI_GRID", gridSpan: 12, props: { columns: 4 } },
        { sectionId: "sec_activity", name: "Real-Time Activity Feed", componentType: "ACTIVITY_FEED", gridSpan: 8, props: {} }
      );
      return {
        pageId: page.id,
        title: page.title,
        path: page.path,
        layoutStructure: "APP_SHELL",
        sections,
      };
    }

    if (page.layoutType === "DATA_TABLE") {
      sections.push(
        { sectionId: "sec_nav", name: "Top Header Bar", componentType: "NAVIGATION_BAR", gridSpan: 12, props: {} },
        { sectionId: "sec_table", name: "Filterable Data Table", componentType: "DATA_TABLE", gridSpan: 12, props: { searchable: true, pagination: true } }
      );
      return {
        pageId: page.id,
        title: page.title,
        path: page.path,
        layoutStructure: "APP_SHELL",
        sections,
      };
    }

    // Default Form / Detail
    sections.push(
      { sectionId: "sec_form", name: "Form Container", componentType: "FORM_CONTAINER", gridSpan: 6, props: { centered: true } }
    );
    return {
      pageId: page.id,
      title: page.title,
      path: page.path,
      layoutStructure: "CENTERED_CONTAINER",
      sections,
    };
  }
}
