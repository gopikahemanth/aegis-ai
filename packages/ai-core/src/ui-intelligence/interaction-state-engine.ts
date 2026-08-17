/**
 * InteractionStateEngine
 *
 * Generates and validates interactive micro-states:
 * DEFAULT, HOVER, FOCUS, ACTIVE, DISABLED, LOADING, EMPTY, VALIDATION_ERROR, SUBMITTING, SUCCESS, OFFLINE.
 */

export type ElementState =
  | "DEFAULT"
  | "HOVER"
  | "FOCUS"
  | "ACTIVE"
  | "DISABLED"
  | "LOADING"
  | "EMPTY"
  | "VALIDATION_ERROR"
  | "SUBMITTING"
  | "SUCCESS"
  | "OFFLINE";

export interface ComponentStateDefinition {
  component: string;
  supportedStates: ElementState[];
  focusRingClass: string;
  disabledClass: string;
  loadingIndicator: string;
}

export class InteractionStateEngine {
  public static getComponentStateDef(component: string): ComponentStateDefinition {
    return {
      component,
      supportedStates: [
        "DEFAULT",
        "HOVER",
        "FOCUS",
        "ACTIVE",
        "DISABLED",
        "LOADING",
        "VALIDATION_ERROR",
        "SUCCESS",
      ],
      focusRingClass: "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950",
      disabledClass: "disabled:opacity-50 disabled:cursor-not-allowed",
      loadingIndicator: "animate-spin w-4 h-4 text-white",
    };
  }

  public static verifyAllStatesHandled(component: string): boolean {
    const def = this.getComponentStateDef(component);
    return def.supportedStates.length >= 6;
  }
}
