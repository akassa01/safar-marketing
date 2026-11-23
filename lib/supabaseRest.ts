/**
 * Minimal anon PostgREST helper for public, read-only data.
 *
 * Uses the same public URL and anon key that ship in the iOS app (RLS scopes
 * anon reads to public content). They are hardcoded so pages work on Vercel
 * with no env setup and never fail on a missing variable. Never use the
 * service-role key here.
 *
 * Every call degrades to `null` on any failure so callers can render a
 * branded fallback instead of an error.
 */

export const SUPABASE_URL = "https://nuywagndcbujbqneglje.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51eXdhZ25kY2J1amJxbmVnbGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMjYzODMsImV4cCI6MjA2ODgwMjM4M30.R25FLGNrhBra1LiugbcpYDsuxdc7FYtD-kJdYfeh100";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parses a positive integer id from untrusted input, or returns null. */
export function parseId(raw: string): number | null {
  if (!/^[0-9]{1,15}$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export async function rest<T = Record<string, unknown>>(
  query: string,
): Promise<T[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Cache public data at the edge; shared links are read-heavy.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

export type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string | null };

/**
 * Calls an anon-callable Postgres function. Never cached, because callers
 * read state an owner can change (a closed link) or write data.
 */
export async function rpc<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<RpcResult<T>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      let code: string | null = null;
      try {
        const err = (await res.json()) as { code?: unknown };
        if (typeof err.code === "string") code = err.code;
      } catch {
        // Non-JSON error body; the status is enough.
      }
      return { ok: false, status: res.status, code };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0, code: null };
  }
}
