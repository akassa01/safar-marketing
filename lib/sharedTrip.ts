/**
 * Public data for a shared-city link (`/u/{userId}/city/{cityId}`), used by
 * the guide page, its metadata, and the OG image route.
 *
 * Catalog data (city, photo) is read directly. Everything about the sharer
 * comes from the `get_shared_guide` function, which returns only what this
 * page shows: the trip note on a visited city, but not per-place notes. Place
 * notes aren't secret (the app shows them on feed posts to signed-in users),
 * but the guide is public and leaves them out.
 *
 * Every helper degrades to `null` or empty on failure so callers can render
 * a valid branded fallback.
 */
import { UUID_RE, parseId, rest, rpcGet } from "@/lib/supabaseRest";
import { normalizeCategory, type CategoryKey } from "@/lib/placeCategories";

export interface GuidePlace {
  id: number;
  name: string;
  category: CategoryKey;
  liked: boolean;
  latitude: number;
  longitude: number;
}

export interface SharedTrip {
  cityName: string;
  admin: string | null;
  country: string;
  /** City centre. `cities.latitude`/`longitude` are nullable, so either can be null. */
  latitude: number | null;
  longitude: number | null;
  photo: {
    url: string;
    photographer: string | null;
    unsplashUrl: string | null;
  } | null;
  /** Display name of the sharer, or `@username`, or null if not resolvable. */
  sharerName: string | null;
  sharer: {
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
  /** Trip note from a visited city, or null. */
  tripNote: string | null;
  /** Coordinates of the sharer's saved places in this city (for the dot map). */
  places: { latitude: number; longitude: number }[];
  guidePlaces: GuidePlace[];
}

/** Shape of `get_shared_guide` (supabase/migrations/20261123_shared_guide_rpc.sql). */
interface GuideRow {
  sharer: { username: string | null; full_name: string | null; has_avatar: boolean } | null;
  visited: boolean;
  trip_note: string | null;
  places: {
    id: number;
    name: string | null;
    category: string | null;
    liked: boolean | null;
    latitude: number | null;
    longitude: number | null;
  }[];
}

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Fetches the public shape of a shared city guide. Returns `null` only when
 * the city can't be resolved. Sharer, photo, note and places are best-effort.
 */
export async function getSharedTrip(
  userId: string,
  cityIdRaw: string,
): Promise<SharedTrip | null> {
  const cityId = parseId(cityIdRaw);
  if (cityId === null) return null;
  const validUser = UUID_RE.test(userId);

  const [cityRows, photoRows, guide] = await Promise.all([
    rest<{
      display_name: string;
      admin: string | null;
      country: string | null;
      latitude: number | null;
      longitude: number | null;
    }>(
      `cities?id=eq.${cityId}&select=display_name,admin,country,latitude,longitude&limit=1`,
    ),
    rest<{
      photo_url_regular: string | null;
      photographer_name: string | null;
      unsplash_url: string | null;
    }>(
      `city_photos?city_id=eq.${cityId}&select=photo_url_regular,photographer_name,unsplash_url&limit=1`,
    ),
    // Per-user data comes only through get_shared_guide: anon can't read
    // user_city, user_place, or profiles. The function already drops
    // bucket-list rows, disliked places, place notes, and every place when
    // the city isn't visited.
    validUser
      ? rpcGet<GuideRow>("get_shared_guide", { p_user_id: userId, p_city_id: cityId })
      : Promise.resolve(null),
  ]);

  const city = cityRows?.[0];
  if (!city) return null;

  const photoRow = photoRows?.[0];
  const photo = photoRow?.photo_url_regular
    ? {
        url: photoRow.photo_url_regular,
        photographer: photoRow.photographer_name?.trim() || null,
        unsplashUrl: photoRow.unsplash_url || null,
      }
    : null;

  const profile = guide?.sharer ?? null;
  const fullName = profile?.full_name?.trim() || null;
  const username = profile?.username?.trim() || null;
  const sharer = profile
    ? {
        fullName,
        username,
        // The avatar is a path in a private bucket; the avatar route serves it.
        avatarUrl: profile.has_avatar ? `/api/avatar/${userId}` : null,
      }
    : null;
  const sharerName = fullName || (username ? `@${username}` : null);

  const tripNote = guide?.trip_note?.trim() || null;

  const guidePlaces: GuidePlace[] = [];
  for (const p of Array.isArray(guide?.places) ? guide.places : []) {
    if (!p?.name?.trim() || !isNum(p.latitude) || !isNum(p.longitude)) continue;
    guidePlaces.push({
      id: p.id,
      name: p.name.trim(),
      category: normalizeCategory(p.category),
      liked: p.liked === true,
      latitude: p.latitude,
      longitude: p.longitude,
    });
  }

  return {
    cityName: city.display_name,
    admin: city.admin?.trim() || null,
    country: city.country ?? "",
    // Keep the pair together: one valid half of a coordinate is no coordinate.
    latitude: isNum(city.latitude) && isNum(city.longitude) ? city.latitude : null,
    longitude: isNum(city.latitude) && isNum(city.longitude) ? city.longitude : null,
    photo,
    sharerName,
    sharer,
    tripNote,
    places: guidePlaces.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    guidePlaces,
  };
}
