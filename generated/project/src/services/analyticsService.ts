export const analyticsService = {
  trackEvent(category: string, action: string, label?: string): void {
    // Production telemetry simulation or console dispatch
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Category: ${category} | Action: ${action} ${label ? `| Label: ${label}` : ''}`);
    }
  },

  trackPageView(path: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] PageView: ${path}`);
    }
  }
};