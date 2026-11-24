import { parseId, rest } from "@/lib/supabaseRest";
import {
  CATEGORY_TITLES,
  normalizeCategory,
  type CategoryKey,
} from "@/lib/placeCategories";

export interface SharedPlace {
  name: string;
  /** Category title such as "Food & Drink", or null when unknown. */
  category: string | null;
  /** Category key for color, or null when unknown (the fallback link has none). */
  categoryKey: CategoryKey | null;
  latitude: number;
  longitude: number;
  /** "City, Country" when known. */
  cityLabel: string | null;
}

const isCoord = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max;

/** Reads a catalog place by `places.id`. Returns null on any failure. */
export async function getCatalogPlace(
  idRaw: string,
): Promise<SharedPlace | null> {
  const id = parseId(idRaw);
  if (id === null) return null;

  const rows = await rest<{
    name: string | null;
    category: string | null;
    latitude: number | null;
    longitude: number | null;
    cities: { display_name: string | null; country: string | null } | null;
  }>(
    `places?id=eq.${id}&select=id,name,category,latitude,longitude,cities(display_name,country)&limit=1`,
  );
  const row = rows?.[0];
  const name = row?.name?.trim();
  if (!row || !name || !isCoord(row.latitude, 90) || !isCoord(row.longitude, 180)) {
    return null;
  }

  const cityLabel =
    [row.cities?.display_name, row.cities?.country].filter(Boolean).join(", ") ||
    null;

  return {
    name,
    category: CATEGORY_TITLES[normalizeCategory(row.category)],
    categoryKey: normalizeCategory(row.category),
    latitude: row.latitude,
    longitude: row.longitude,
    cityLabel,
  };
}

/** Validates the name+coordinates fallback link. Returns null when invalid. */
export function placeFromQuery(q: {
  n?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
}): SharedPlace | null {
  const { n, lat, lng } = q;
  if (typeof n !== "string" || typeof lat !== "string" || typeof lng !== "string") {
    return null;
  }
  const name = n.replace(/\s+/g, " ").trim();
  if (!name || name.length > 120) return null;
  if (lat.trim() === "" || lng.trim() === "") return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!isCoord(latitude, 90) || !isCoord(longitude, 180)) return null;
  return { name, category: null, categoryKey: null, latitude, longitude, cityLabel: null };
}
