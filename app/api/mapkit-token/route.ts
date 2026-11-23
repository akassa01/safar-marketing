import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

export const dynamic = "force-dynamic";

/**
 * MapKit JS token endpoint. Two modes:
 *  - MAPKIT_TEAM_ID + MAPKIT_KEY_ID + MAPKIT_PRIVATE_KEY set → signs a
 *    short-lived ES256 JWT (preferred; key never leaves the server).
 *  - NEXT_PUBLIC_MAPKIT_TOKEN set → returns it (Apple's pre-generated token).
 * Returns 404 when neither is configured; the map components degrade
 * gracefully to a placeholder.
 */
export async function GET() {
  const teamId = process.env.MAPKIT_TEAM_ID;
  const keyId = process.env.MAPKIT_KEY_ID;
  const privateKey = process.env.MAPKIT_PRIVATE_KEY;

  if (teamId && keyId && privateKey) {
    try {
      const pem = privateKey.includes("BEGIN PRIVATE KEY")
        ? privateKey.replace(/\\n/g, "\n")
        : `-----BEGIN PRIVATE KEY-----\n${privateKey.replace(/\\n/g, "\n")}\n-----END PRIVATE KEY-----`;
      const key = await importPKCS8(pem, "ES256");
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
        .setIssuer(teamId)
        .setIssuedAt()
        .setExpirationTime("30m")
        .sign(key);
      return new NextResponse(token, {
        headers: { "content-type": "text/plain" },
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
