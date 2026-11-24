import { cache } from "react";
import { rpc } from "@/lib/supabaseRest";

export const TOKEN_RE = /^[A-Za-z0-9_-]{12}$/;

export interface AskRequest {
  requestId: string;
  cityId: number;
  cityName: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  requesterName: string;
  promptNote: string | null;
}

interface Row {
  request_id: string;
  city_id: number;
  city_name: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  requester_name: string | null;
  prompt_note: string | null;
  active: boolean;
}

/**
 * `closed` means the token is unknown or the link was closed. `error` means the
 * lookup itself failed, so the link may still be open and the page asks the friend
 * to retry instead of telling them to request a new link.
 */
export type AskLookup =
  | { status: "open"; ask: AskRequest }
  | { status: "closed" }
  | { status: "error" };

/**
 * Looks up the open ask request for a token. Wrapped in `cache` so the page and
 * its metadata share one RPC per render.
 */
export const getAskRequest = cache(async (token: string): Promise<AskLookup> => {
  if (!TOKEN_RE.test(token)) return { status: "closed" };
  const res = await rpc<Row[]>("get_rec_request_by_token", { p_token: token });
  if (!res.ok || !Array.isArray(res.data)) return { status: "error" };
  const row = res.data[0];
  if (!row || !row.active || !row.city_name) return { status: "closed" };
  const ask: AskRequest = {
    requestId: row.request_id,
    cityId: row.city_id,
    cityName: row.city_name,
    country: row.country || null,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    requesterName: row.requester_name?.trim() || "A friend",
    promptNote: row.prompt_note?.trim() || null,
  };
  return { status: "open", ask };
});
