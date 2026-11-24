/**
 * Public data for a shared-city link (`/u/{userId}/city/{cityId}`), used by
 * the guide page, its metadata, and the OG image route.
 *
 * Reads only anon-readable, public content through `lib/supabaseRest.ts`.
 * Per-place notes are private in the app, so `user_place.note` is never
 * selected. Only the trip note on a visited city is public.
 *
 * Every helper degrades to `null` or empty on failure so callers can render
 * a valid branded fallback.
 */
import { UUID_RE, parseId, rest } from "@/lib/supabaseRest";
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

  const none = Promise.resolve(null);
  const [cityRows, photoRows, profileRows, noteRows, placeRows] =
    await Promise.all([
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
      validUser
        ? rest<{
            username: string | null;
            full_name: string | null;
            avatar_url: string | null;
          }>(
            `profiles?id=eq.${userId}&select=username,full_name,avatar_url&limit=1`,
          )
        : none,
      validUser
        ? rest<{ notes: string | null }>(
            // visited=eq.true: a bucket-list row's note is never exposed, and this
            // row also gates the places below.
            `user_city?user_id=eq.${userId}&city_id=eq.${cityId}&visited=eq.true&select=notes&limit=1`,
          )
        : none,
      validUser
        ? rest<{
            liked: boolean | null;
            category: string | null;
            places: {
              id: number;
              name: string | null;
              category: string | null;
              latitude: number | null;
              longitude: number | null;
            } | null;
          }>(
            // bucket_list=false: private bucket-list places are excluded
            // anywhere another user's places are shown (same rule as iOS).
            // liked=false is an explicit dislike, which doesn't belong in a
            // guide of places to try; liked=null is visited without a rating.
            // `note` is deliberately not selected.
            `user_place?user_id=eq.${userId}&bucket_list=eq.false&or=(liked.is.null,liked.eq.true)&select=liked,category,places!inner(id,name,category,latitude,longitude,city_id)&places.city_id=eq.${cityId}`,
          )
        : none,
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

  const profile = profileRows?.[0];
  const fullName = profile?.full_name?.trim() || null;
  const username = profile?.username?.trim() || null;
  const sharer = profile
    ? {
        fullName,
        username,
        // avatar_url is a path in a private bucket; the avatar route serves it.
        avatarUrl: profile.avatar_url ? `/api/avatar/${userId}` : null,
      }
    : null;
  const sharerName = fullName || (username ? `@${username}` : null);

  // A guide exists only for a city the sharer has visited. Without the visited
  // row, the city is bucket-listed or absent, so nothing personal is shown.
  const visitedRow = noteRows?.[0];
  const tripNote = visitedRow?.notes?.trim() || null;

  const guidePlaces: GuidePlace[] = [];
  for (const row of visitedRow ? (placeRows ?? []) : []) {
    const p = row.places;
    if (!p || !p.name?.trim() || !isNum(p.latitude) || !isNum(p.longitude)) {
      continue;
    }
    guidePlaces.push({
      id: p.id,
      name: p.name.trim(),
      category: normalizeCategory(row.category ?? p.category),
      liked: row.liked === true,
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
