import { NextResponse } from "next/server";
import { TOKEN_RE } from "@/lib/askRequest";
import { rpc } from "@/lib/supabaseRest";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;
const CATEGORIES = ["restaurant", "hotel", "activity", "shop", "nightlife", "other"];
const NO_STORE = { "Cache-Control": "no-store" };

type Params = Promise<{ token: string }>;

function reply(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function coord(value: unknown, limit: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit
    ? value
    : null;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return reply({ error: "closed" }, 404);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return reply({ error: "invalid" }, 400);
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return reply({ error: "invalid" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "invalid" }, 400);
  }

  // A filled honeypot means a bot. Pretend it worked and send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return reply({ ok: true }, 200);
  }

  const senderName = text(body.senderName, 60);
  const placeName = text(body.placeName, 120);
  if (!senderName || !placeName) return reply({ error: "invalid" }, 400);

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 240) : "";
  const mapKitId = text(body.mapKitId, 200);
  let latitude = coord(body.latitude, 90);
  let longitude = coord(body.longitude, 180);
  if (latitude === null || longitude === null) {
    latitude = null;
    longitude = null;
  }
  const category =
    typeof body.category === "string" && CATEGORIES.includes(body.category)
      ? body.category
      : "other";

  const res = await rpc("submit_trip_rec", {
    p_token: token,
    p_sender_name: senderName,
    p_place_name: placeName,
    p_latitude: latitude,
    p_longitude: longitude,
    p_map_kit_id: mapKitId || null,
    p_category: category,
    p_note: note || null,
  });

  if (res.ok) return reply({ ok: true }, 200);
  if (res.code === "P0002") return reply({ error: "closed" }, 404);
  if (res.code === "54000") return reply({ error: "full" }, 409);
  if (res.code === "22023") return reply({ error: "invalid" }, 400);
  return reply({ error: "failed" }, 502);
}
