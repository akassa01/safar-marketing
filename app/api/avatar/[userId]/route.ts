import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, UUID_RE, rest } from "@/lib/supabaseRest";

/**
 * A sharer's avatar for the city guide. The `avatars` bucket isn't public, and an
 * `<img>` can't send the anon key, so this reads it server side. It serves only the
 * path stored on that user's profile, never an arbitrary storage path.
 *
 * `avatar_url` is user-written, so it's treated as untrusted: the route fetches only
 * from this project's Storage host, and it serves only raster image types. An SVG
 * served from this origin could run script, so it's refused.
 */
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const STORAGE_ORIGIN = new URL(SUPABASE_URL).origin;

function notFound() {
  return new NextResponse(null, { status: 404 });
}

/** Resolves a stored avatar value to a Storage URL, or null if it points anywhere else. */
function storageUrl(value: string): string | null {
  // Older rows hold a full Storage URL; newer ones hold a bucket path.
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    // URL parsing already collapses `..`, so check the normalized result.
    if (url.origin !== STORAGE_ORIGIN || !url.pathname.startsWith("/storage/v1/object/")) {
      return null;
    }
    return url.toString();
  }

  const segments = value.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) {
    return null;
  }
  return `${STORAGE_ORIGIN}/storage/v1/object/authenticated/avatars/${segments
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) return notFound();

  const rows = await rest<{ avatar_url: string | null }>(
    `profiles?id=eq.${userId}&select=avatar_url&limit=1`,
  );
  const stored = rows?.[0]?.avatar_url?.trim();
  const source = stored ? storageUrl(stored) : null;
  if (!source) return notFound();

  try {
    const res = await fetch(source, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      // Storage redirects would bypass the host check above.
      redirect: "error",
      next: { revalidate: 3600 },
    });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!res.ok || !ALLOWED_TYPES.has(type)) return notFound();
    return new NextResponse(res.body, {
      headers: {
        "content-type": type,
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return notFound();
  }
}
