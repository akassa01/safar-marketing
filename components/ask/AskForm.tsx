"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { loadMapKit } from "@/lib/mapkitLoader";
import { categoryFromPoi, type AskCategory } from "@/lib/askCategory";
import { APP_STORE_URL } from "@/lib/appStore";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  token: string;
  requesterName: string;
  cityName: string;
  center: { lat: number; lng: number } | null;
}

interface Picked {
  latitude: number | null;
  longitude: number | null;
  mapKitId: string | null;
  category: AskCategory;
}

interface Suggestion {
  title: string;
  subtitle: string;
  raw: any;
}

const NAME_KEY = "safar.ask.name";
const NOTE_MAX = 240;
const EMPTY_PICK: Picked = { latitude: null, longitude: null, mapKitId: null, category: "other" };

const ERRORS: Record<string, string> = {
  closed: "This link is no longer open",
  full: "This list is full",
};

const inputClass =
  "w-full rounded-xl border border-dark/15 bg-white px-4 py-3 text-base text-dark placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

/** Within about 80 km of the city centre. True when the city has no coordinates. */
function nearCity(pLat: number, pLng: number, lat?: number, lng?: number): boolean {
  if (lat === undefined || lng === undefined) return true;
  const rad = Math.PI / 180;
  const dLat = (pLat - lat) * rad;
  const dLng = (pLng - lng) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat * rad) * Math.cos(pLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a)) <= 80;
}

export default function AskForm({ token, requesterName, cityName, center }: Props) {
  const listId = useId();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [picked, setPicked] = useState<Picked>(EMPTY_PICK);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<any>(null);
  // The text a pick put in the box. Autocomplete skips it, so the dropdown doesn't
  // reopen while the picked place is still resolving (or if resolving fails).
  const pickedText = useRef<string | null>(null);
  const seq = useRef(0);
  const placeInput = useRef<HTMLInputElement>(null);
  const lat = center?.lat;
  const lng = center?.lng;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved.slice(0, 60));
    } catch {
      // Storage can be blocked. The form works without it.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMapKit().then((mapkit) => {
      if (cancelled || !mapkit) return;
      try {
        const options: Record<string, unknown> = { includePointsOfInterest: true };
        if (lat !== undefined && lng !== undefined) {
          options.region = new mapkit.CoordinateRegion(
            new mapkit.Coordinate(lat, lng),
            new mapkit.CoordinateSpan(0.3, 0.3),
          );
        }
        // Keep results inside the city's region, not merely ranked by it.
        const required = mapkit.Search?.RegionPriority?.Required;
        if (options.region && required) options.regionPriority = required;
        searchRef.current = new mapkit.Search(options);
      } catch {
        searchRef.current = null;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  // Debounced autocomplete. Typing after a pick clears the pick (see onChange).
  useEffect(() => {
    const query = place.trim();
    const mine = ++seq.current;
    if (
      query.length < 2 ||
      picked.mapKitId ||
      picked.latitude !== null ||
      place === pickedText.current
    ) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const search = searchRef.current;
      if (!search) return;
      try {
        search.autocomplete(query, (err: unknown, data: any) => {
          if (err || mine !== seq.current) return;
          // Places only (query rows like "Search Nearby" carry no coordinate), and
          // only ones in this city, so a same-name branch elsewhere can't be picked.
          const results = ((data?.results ?? []) as any[])
            .filter((r) => r.coordinate && nearCity(r.coordinate.latitude, r.coordinate.longitude, lat, lng))
            .slice(0, 5);
          setSuggestions(
            results.map((r) => ({
              title: r.displayLines?.[0] ?? "",
              subtitle: r.displayLines?.[1] ?? "",
              raw: r,
            })).filter((s) => s.title),
          );
          setActive(-1);
        });
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [place, picked, lat, lng]);

  function onPlaceChange(value: string) {
    pickedText.current = null;
    setPlace(value);
    setPicked(EMPTY_PICK);
    setError(null);
  }

  function pick(s: Suggestion) {
    setSuggestions([]);
    pickedText.current = s.title;
    setPlace(s.title);
    seq.current++;
    const search = searchRef.current;
    if (!search) return;
    try {
      search.search(s.raw, (err: unknown, data: any) => {
        const found = data?.places?.[0];
        if (err || !found?.coordinate) return;
        if (!nearCity(found.coordinate.latitude, found.coordinate.longitude, lat, lng)) return;
        setPicked({
          latitude: found.coordinate.latitude,
          longitude: found.coordinate.longitude,
          mapKitId: typeof found.id === "string" ? found.id : null,
          category: categoryFromPoi(found.pointOfInterestCategory),
        });
        if (typeof found.name === "string" && found.name) setPlace(found.name);
      });
    } catch {
      // The typed name is still submitted without coordinates.
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !name.trim() || !place.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ask/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: name.trim(),
          placeName: place.trim(),
          note: note.trim(),
          latitude: picked.latitude,
          longitude: picked.longitude,
          mapKitId: picked.mapKitId,
          category: picked.category,
          website,
        }),
      });
      if (res.ok) {
        try {
          localStorage.setItem(NAME_KEY, name.trim());
        } catch {
          // Remembering the name is a convenience only.
        }
        setSent(true);
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(ERRORS[body.error ?? ""] ?? "Couldn't send that. Try again.");
      }
    } catch {
      setError("Couldn't send that. Try again.");
    } finally {
      setSending(false);
    }
  }

  function another() {
    setPlace("");
    setNote("");
    setPicked(EMPTY_PICK);
    setSuggestions([]);
    setSent(false);
    setError(null);
    setTimeout(() => placeInput.current?.focus(), 0);
  }

  if (sent) {
    return (
      <section className="mt-8 rounded-2xl bg-accent/10 px-6 py-8 text-center" aria-live="polite">
        <p className="font-headline text-2xl font-extrabold uppercase tracking-tight">
          Sent to {requesterName}&apos;s {cityName} map
        </p>
        <button
          type="button"
          onClick={another}
          className="mt-5 rounded-full bg-dark px-6 py-3 text-base font-medium text-background transition-opacity hover:opacity-90"
        >
          Add another spot
        </button>
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-dark/10 pt-6">
          <p className="text-sm text-muted">Keep your own map on Safar</p>
          <a href={APP_STORE_URL} aria-label="Download Safar on the App Store">
            <Image src="/app-store-badge.svg" alt="Download on the App Store" width={128} height={43} />
          </a>
        </div>
      </section>
    );
  }

  const open = suggestions.length > 0;
  const canSend = !sending && name.trim().length > 0 && place.trim().length > 0;

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
      <div className="relative">
        <label htmlFor="ask-place" className="mb-1.5 block text-sm font-medium">
          A place you love in {cityName}
        </label>
        <input
          ref={placeInput}
          id="ask-place"
          type="text"
          value={place}
          maxLength={120}
          onChange={(e) => onPlaceChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          autoComplete="off"
          enterKeyHint="next"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Restaurant, café, park"
          className={inputClass}
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-dark/15 bg-white shadow-lg"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.title}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className={`cursor-pointer px-4 py-2.5 ${i === active ? "bg-accent/10" : ""}`}
              >
                <span className="block text-base">{s.title}</span>
                {s.subtitle && <span className="block text-sm text-muted">{s.subtitle}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="ask-note" className="mb-1.5 block text-sm font-medium">
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="ask-note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What to order or why you love it"
          className={`${inputClass} resize-none`}
        />
        {note.length >= NOTE_MAX - 40 && (
          <p className="mt-1 text-right text-xs text-muted">
            {note.length}/{NOTE_MAX}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="ask-name" className="mb-1.5 block text-sm font-medium">
          Your first name
        </label>
        <input
          id="ask-name"
          name="name"
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          enterKeyHint="send"
          className={inputClass}
        />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSend}
        className="rounded-full bg-dark px-6 py-3.5 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? "Sending" : `Send to ${requesterName}`}
      </button>
    </form>
  );
}
