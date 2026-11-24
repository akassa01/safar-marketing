"use client";

import { useRef, useState } from "react";
import GuideMap from "@/components/GuideMap";
import {
  CATEGORY_COLORS,
  CATEGORY_ORDER,
  CATEGORY_TITLES,
  type CategoryKey,
} from "@/lib/placeCategories";
import type { GuidePlace } from "@/lib/sharedTrip";

interface Props {
  places: GuidePlace[];
  /** City centre, or null when the city has no coordinates. */
  center: { lat: number; lng: number } | null;
  cityLabel: string;
}

function mapsUrl(p: GuidePlace) {
  return `https://maps.apple.com/?ll=${p.latitude},${p.longitude}&q=${encodeURIComponent(p.name)}`;
}

export default function GuidePlaces({ places, center, cityLabel }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (places.length === 0) {
    return (
      <p className="mt-10 text-muted">No places saved here yet.</p>
    );
  }

  function select(id: number) {
    setSelectedId(id);
    document
      .getElementById(`place-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSelectedId(null), 2000);
  }

  const groups = CATEGORY_ORDER.map((key: CategoryKey) => ({
    key,
    items: places.filter((p) => p.category === key),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <GuideMap
        className="mt-10"
        center={center ?? { lat: places[0].latitude, lng: places[0].longitude }}
        cityLabel={cityLabel}
        selectedId={selectedId}
        onSelect={select}
        pins={places.map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.latitude,
          lng: p.longitude,
          color: CATEGORY_COLORS[p.category],
        }))}
      />

      {groups.map((group) => (
        <section key={group.key} className="mt-10">
          <h2 className="flex items-center gap-2.5 font-headline text-2xl font-extrabold uppercase tracking-tight">
            {/* The same dot as this category's pins, so the list keys the map. */}
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full ring-2 ring-white"
              style={{ backgroundColor: CATEGORY_COLORS[group.key] }}
            />
            {CATEGORY_TITLES[group.key]}{" "}
            <span className="text-muted">{group.items.length}</span>
          </h2>
          <ul className="mt-3 divide-y divide-dark/10">
            {group.items.map((p) => (
              <li
                key={p.id}
                id={`place-${p.id}`}
                className={`-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors duration-500 ${
                  selectedId === p.id ? "bg-accent/15" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.liked && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      Liked
                    </span>
                  )}
                </div>
                <a
                  href={mapsUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${p.name} in Apple Maps`}
                  className="shrink-0 rounded-full border border-dark/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-dark hover:text-background"
                >
                  Apple Maps
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
