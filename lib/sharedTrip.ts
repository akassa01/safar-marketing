/**
 * Public data for a shared-city link (`/u/{userId}/city/{cityId}`), used by
 * both the OG image route and the fallback page's metadata.
 *
 * Reads ONLY anon-readable, public content straight from Supabase PostgREST
 * over `fetch` — no `@supabase/supabase-js` dependency, no service-role key.
 * The Supabase URL + anon key are the same public pair that ships in the iOS
 * app (RLS scopes anon reads to public content: cities, profiles' public
 * columns, user_place → places). They are hardcoded so the route works on
 * Vercel with zero env-var setup and can never 500 on a missing env var.
 *
 * Every helper degrades to `null`/empty on any failure so callers can render
 * a valid branded fallback rather than error.
 */

const SUPABASE_URL = "https://nuywagndcbujbqneglje.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51eXdhZ25kY2J1amJxbmVnbGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMjYzODMsImV4cCI6MjA2ODgwMjM4M30.R25FLGNrhBra1LiugbcpYDsuxdc7FYtD-kJdYfeh100";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SharedTrip {
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  /** Display name of the sharer, or `@username`, or null if not resolvable. */
  sharerName: string | null;
  /** Coordinates of the sharer's saved places in this city (for the dot map). */
  places: { latitude: number; longitude: number }[];
}

async function rest<T = Record<string, unknown>>(
  query: string,
): Promise<T[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Cache public data at the edge; unfurls are read-heavy and immutable-ish.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

/**
 * Fetches the public shape of a shared trip. Returns `null` when the city
 * can't be resolved (unknown/garbage cityId) — the sharer and places are
 * best-effort and left null/empty when unavailable.
 */
export async function getSharedTrip(
  userId: string,
  cityIdRaw: string,
): Promise<SharedTrip | null> {
  const cityId = Number(cityIdRaw);
  if (!Number.isInteger(cityId) || cityId <= 0) return null;

  const cityRows = await rest<{
    display_name: string;
    country: string | null;
    latitude: number;
    longitude: number;
  }>(
    `cities?id=eq.${cityId}&select=display_name,country,latitude,longitude&limit=1`,
  );
  const city = cityRows?.[0];
  if (!city) return null;

  const validUser = UUID_RE.test(userId);
  const [profileRows, placeRows] = await Promise.all([
    validUser
      ? rest<{ username: string | null; full_name: string | null }>(
          `profiles?id=eq.${userId}&select=username,full_name&limit=1`,
        )
      : Promise.resolve(null),
    validUser
      ? rest<{ places: { latitude: number; longitude: number } | null }>(
          // bucket_list=false: private bucket-list places are excluded anywhere
          // another user's places are shown — same rule as the iOS app.
          `user_place?user_id=eq.${userId}&bucket_list=eq.false&select=places!inner(latitude,longitude,city_id)&places.city_id=eq.${cityId}`,
        )
      : Promise.resolve(null),
  ]);

  const profile = profileRows?.[0];
  const sharerName =
    profile?.full_name?.trim() ||
    (profile?.username ? `@${profile.username}` : null);

  const places = (placeRows ?? [])
    .map((row) => row.places)
    .filter(
      (p): p is { latitude: number; longitude: number } =>
        !!p &&
        typeof p.latitude === "number" &&
        typeof p.longitude === "number",
    )
    .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  return {
    cityName: city.display_name,
    country: city.country ?? "",
    latitude: city.latitude,
    longitude: city.longitude,
    sharerName,
    places,
  };
}
