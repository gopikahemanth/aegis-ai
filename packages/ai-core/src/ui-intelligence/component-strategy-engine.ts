/**
 * ComponentStrategyEngine
 *
 * Defines and tracks the canonical catalog of reusable, modular UI components to prevent ad-hoc component duplication.
 */

export interface CanonicalComponentDef {
  name: string;
  category: "PRIMITIVE" | "LAYOUT" | "FEEDBACK" | "DATA_DISPLAY" | "OVERLAY";
  description: string;
  propsInterface: string;
  accessibilityRole: string;
}

export class ComponentStrategyEngine {
  private static catalog: CanonicalComponentDef[] = [
    { name: "Button", category: "PRIMITIVE", description: "Interactive button supporting primary, secondary, and ghost variants", propsInterface: "ButtonProps", accessibilityRole: "button" },
    { name: "Input", category: "PRIMITIVE", description: "Accessible text input with validation error states", propsInterface: "InputProps", accessibilityRole: "textbox" },
    { name: "Card", category: "LAYOUT", description: "Glassmorphic bordered container with header, body, and footer", propsInterface: "CardProps", accessibilityRole: "region" },
    { name: "Modal", category: "OVERLAY", description: "Accessible focus-trapped dialog modal with backdrop blur", propsInterface: "ModalProps", accessibilityRole: "dialog" },
    { name: "DataTable", category: "DATA_DISPLAY", description: "Searchable, sortable, paginated data grid", propsInterface: "DataTableProps", accessibilityRole: "table" },
    { name: "Sidebar", category: "LAYOUT", description: "Responsive collapsible navigation rail", propsInterface: "SidebarProps", accessibilityRole: "navigation" },
    { name: "Navbar", category: "LAYOUT", description: "Top identity and user profile actions bar", propsInterface: "NavbarProps", accessibilityRole: "banner" },
    { name: "Toast", category: "FEEDBACK", description: "Ephemeral notification banner (success, error, info)", propsInterface: "ToastProps", accessibilityRole: "alert" },
    { name: "EmptyState", category: "FEEDBACK", description: "Zero-data visual illustration with creation CTA", propsInterface: "EmptyStateProps", accessibilityRole: "region" },
    { name: "LoadingState", category: "FEEDBACK", description: "Animated skeleton shimmer loader", propsInterface: "LoadingStateProps", accessibilityRole: "status" },
  ];

  public static getCanonicalCatalog(): CanonicalComponentDef[] {
    return [...this.catalog];
  }

  public static getComponent(name: string): CanonicalComponentDef | undefined {
    return this.catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
  }
}
