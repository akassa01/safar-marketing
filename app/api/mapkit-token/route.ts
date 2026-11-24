import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

export const dynamic = "force-dynamic";

/**
 * Hosts a signed token may be used on. Apple enforces the JWT's `origin` claim, so a
 * token fetched from here doesn't work on another site and can't spend our quota.
 */
function allowedOrigin(request: Request): string | null {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!host) return null;

  const hostname = host.replace(/:\d+$/, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") return `http://${host}`;

  const allowed = new Set(
    [
      "getsafar.ca",
      "www.getsafar.ca",
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter((h): h is string => Boolean(h)),
  );
  return allowed.has(host) ? `https://${host}` : null;
}

/**
 * MapKit JS token endpoint. Two modes:
 *  - MAPKIT_TEAM_ID + MAPKIT_KEY_ID + MAPKIT_PRIVATE_KEY set → signs a
 *    short-lived ES256 JWT (preferred; key never leaves the server).
 *  - NEXT_PUBLIC_MAPKIT_TOKEN set → returns it (Apple's pre-generated token).
 *    Its domain restriction is set when Apple generates it, not here.
 * Returns 404 when neither is configured; the map components degrade
 * gracefully to a placeholder.
 */
export async function GET(request: Request) {
  const teamId = process.env.MAPKIT_TEAM_ID;
  const keyId = process.env.MAPKIT_KEY_ID;
  const privateKey = process.env.MAPKIT_PRIVATE_KEY;

  if (teamId && keyId && privateKey) {
    const origin = allowedOrigin(request);
    if (!origin) return new NextResponse("origin not allowed", { status: 403 });
    try {
      const pem = privateKey.includes("BEGIN PRIVATE KEY")
        ? privateKey.replace(/\\n/g, "\n")
        : `-----BEGIN PRIVATE KEY-----\n${privateKey.replace(/\\n/g, "\n")}\n-----END PRIVATE KEY-----`;
      const key = await importPKCS8(pem, "ES256");
      const token = await new SignJWT({ origin })
        .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
        .setIssuer(teamId)
        .setIssuedAt()
        .setExpirationTime("30m")
        .sign(key);
      return new NextResponse(token, {
        headers: { "content-type": "text/plain", "cache-control": "no-store" },
      });
    } catch (error) {
      console.error("MapKit token signing failed:", error);
      return new NextResponse("token signing failed", { status: 500 });
    }
  }

  const staticToken = process.env.NEXT_PUBLIC_MAPKIT_TOKEN;
  if (staticToken) {
    return new NextResponse(staticToken, {
      headers: { "content-type": "text/plain" },
    });
  }

  return new NextResponse("mapkit not configured", { status: 404 });
}
