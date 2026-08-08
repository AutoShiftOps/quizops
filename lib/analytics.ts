// Type declaration for the global gtag function injected by the GA4 script
// in app/layout.tsx. Declared here (not inline at each call site) so every
// file that imports track() gets the typing for free.
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export function track(event: string, params?: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;
  // Covers both "GA4 isn't configured" (NEXT_PUBLIC_GA_ID unset, script
  // never loaded) and "script hasn't finished loading yet" — either way,
  // silently skip rather than throw.
  if (typeof window.gtag === 'undefined') return;
  window.gtag('event', event, params ?? {});
}
