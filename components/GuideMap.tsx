"use client";

import { useEffect, useRef, useState } from "react";

export interface GuidePin {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface GuideMapProps {
  center: { lat: number; lng: number };
  pins: GuidePin[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  cityLabel: string;
  className?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAPKIT_SRC = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
const SAGE = "#76846F";

let loading: Promise<any | null> | null = null;

/** Loads MapKit JS once. Resolves null when unconfigured or on any failure. */
function loadMapKit(): Promise<any | null> {
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

function Fallback({ cityLabel, className }: { cityLabel: string; className: string }) {
  return (
    <div
      className={`flex h-72 flex-col items-center justify-center gap-2 rounded-2xl bg-accent/10 text-accent ${className}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
      </svg>
      <span className="text-sm font-medium">{cityLabel}</span>
    </div>
  );
}

export default function GuideMap({
  center,
  pins,
  selectedId,
  onSelect,
  cityLabel,
  className = "",
}: GuideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const annotationsRef = useRef<Map<number, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const pinsKey = JSON.stringify(pins);
  const { lat, lng } = center;

  useEffect(() => {
    let cancelled = false;
    const annotations = annotationsRef.current;

    loadMapKit().then((mapkit) => {
      if (cancelled) return;
      const el = containerRef.current;
      if (!mapkit || !el) {
        setFailed(true);
        return;
      }
      try {
        const map = new mapkit.Map(el, {
          showsMapTypeControl: false,
          isRotationEnabled: false,
          showsPointsOfInterest: false,
        });
        mapRef.current = map;

        const list = JSON.parse(pinsKey) as GuidePin[];
        const items = list.map((pin) => {
          const annotation = new mapkit.MarkerAnnotation(
            new mapkit.Coordinate(pin.lat, pin.lng),
            {
              title: pin.name,
              color: SAGE,
              glyphText: "",
              // A city's worth of always-on labels overlaps into noise. The name
              // shows when a pin is selected.
              titleVisibility: list.length > 1 ? mapkit.FeatureVisibility.Hidden : mapkit.FeatureVisibility.Adaptive,
            },
          );
          annotation.addEventListener("select", () =>
            onSelectRef.current?.(pin.id),
          );
          annotations.set(pin.id, annotation);
          return annotation;
        });

        if (items.length > 1) {
          map.addAnnotations(items);
          map.showItems(items, {
            animate: false,
            padding: new mapkit.Padding(48, 48, 48, 48),
          });
        } else {
          const at = list.length
            ? new mapkit.Coordinate(list[0].lat, list[0].lng)
            : new mapkit.Coordinate(lat, lng);
          if (items.length) map.addAnnotations(items);
          map.region = new mapkit.CoordinateRegion(
            at,
            new mapkit.CoordinateSpan(0.04, 0.04),
          );
        }
      } catch {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      try {
        mapRef.current?.destroy?.();
      } catch {
        // Nothing useful to do if teardown fails.
      }
      mapRef.current = null;
      annotations.clear();
    };
  }, [pinsKey, lat, lng]);

  useEffect(() => {
    if (selectedId == null) return;
    const annotation = annotationsRef.current.get(selectedId);
    if (annotation && mapRef.current) {
      try {
        mapRef.current.selectedAnnotation = annotation;
      } catch {
        // Selection is cosmetic.
      }
    }
  }, [selectedId]);

  if (failed) return <Fallback cityLabel={cityLabel} className={className} />;

  return (
    <div
      className={`relative h-72 overflow-hidden rounded-2xl bg-accent/10 ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
