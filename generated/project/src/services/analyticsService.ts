export const analyticsService = {
  trackEvent(action: string, category: string, label?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Action: ${action} | Category: ${category} | Label: ${label || 'N/A'}`);
    }
  },
  trackPageView(path: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] PageView: ${path}`);
    }
  }
};