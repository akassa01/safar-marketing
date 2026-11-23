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

/** Returns the open ask request for a token, or null when unknown, closed or unreadable. */
export async function getAskRequest(token: string): Promise<AskRequest | null> {
  if (!TOKEN_RE.test(token)) return null;
  const res = await rpc<Row[]>("get_rec_request_by_token", { p_token: token });
  if (!res.ok || !Array.isArray(res.data)) return null;
  const row = res.data[0];
  if (!row || !row.active || !row.city_name) return null;
  return {
    requestId: row.request_id,
    cityId: row.city_id,
    cityName: row.city_name,
    country: row.country || null,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    requesterName: row.requester_name?.trim() || "A friend",
    promptNote: row.prompt_note?.trim() || null,
  };
}
