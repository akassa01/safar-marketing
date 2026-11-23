import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, UUID_RE, rest } from "@/lib/supabaseRest";

/**
 * A sharer's avatar for the city guide. The `avatars` bucket isn't public, and an
 * `<img>` can't send the anon key, so this reads it server side. It serves only the
 * path stored on that user's profile, never an arbitrary storage path.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) return new NextResponse(null, { status: 404 });

  const rows = await rest<{ avatar_url: string | null }>(
    `profiles?id=eq.${userId}&select=avatar_url&limit=1`,
  );
  const path = rows?.[0]?.avatar_url?.trim();
  if (!path) return new NextResponse(null, { status: 404 });

  // Older rows may hold a full URL; newer ones a bucket path.
  const source = /^https?:\/\//.test(path)
    ? path
    : `${SUPABASE_URL}/storage/v1/object/authenticated/avatars/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

  try {
    const res = await fetch(source, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 3600 },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new NextResponse(null, { status: 404 });
    return new NextResponse(res.body, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
