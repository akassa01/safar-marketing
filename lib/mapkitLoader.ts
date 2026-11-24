/* eslint-disable @typescript-eslint/no-explicit-any */

const MAPKIT_SRC = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
let loading: Promise<any | null> | null = null;

/** Loads MapKit JS once. Resolves null when unconfigured or on any failure. */
export function loadMapKit(): Promise<any | null> {
  if (loading) return loading;
  loading = (async () => {
    try {
      const res = await fetch("/api/mapkit-token");
      if (!res.ok) return null;
      const token = (await res.text()).trim();
      if (!token) return null;

      if (!(window as any).mapkit) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = MAPKIT_SRC;
          script.crossOrigin = "anonymous";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("mapkit script"));
          document.head.appendChild(script);
        });
      }
      const mapkit = (window as any).mapkit;
      if (!mapkit) return null;
      // The first token is already in hand. Later calls come from MapKit when the
      // signed token (30 min) expires, so those fetch a fresh one.
      let first: string | null = token;
      mapkit.init({
        authorizationCallback: (done: (t: string) => void) => {
          if (first) {
            done(first);
            first = null;
            return;
          }
          fetch("/api/mapkit-token")
            .then((r) => (r.ok ? r.text() : ""))
            .then((t) => t.trim() && done(t.trim()))
            .catch(() => {});
        },
      });
      return mapkit;
    } catch {
      return null;
    }
  })();
  // A failed attempt may be retried on a later mount.
  loading.then((m) => {
    if (!m) loading = null;
  });
  return loading;
}
