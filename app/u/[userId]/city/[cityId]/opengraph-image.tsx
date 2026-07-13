import { ImageResponse } from "next/og";
import { COLORS, DotMap, OG_SIZE, OgFrame } from "@/lib/og";
import { getSharedTrip } from "@/lib/sharedTrip";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A trip on Safar";

// Per-city social-preview image for shared links. Always returns a valid
// branded PNG: on any data-fetch failure it degrades to a city-only, then a
// fully generic Safar card — never a 500.
export default async function OgImage({
  params,
}: {
  params: Promise<{ userId: string; cityId: string }>;
}) {
  const { userId, cityId } = await params;

  let trip = null;
  try {
    trip = await getSharedTrip(userId, cityId);
  } catch {
    trip = null;
  }

  const coordinates = trip?.places.length
    ? trip.places
    : trip
      ? [{ latitude: trip.latitude, longitude: trip.longitude }]
      : [];

  const cityLine = trip
    ? [trip.cityName, trip.country].filter(Boolean).join(", ")
    : "Safar";
  const leadIn = trip?.sharerName
    ? `${trip.sharerName}'s trip to`
    : "A trip to";

  return new ImageResponse(
    (
      <OgFrame>
        <DotMap coordinates={coordinates} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "auto 48px 48px",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 40,
              color: COLORS.sageMuted,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {trip ? leadIn : "The social travel journal"}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, display: "flex" }}>
            {cityLine}
          </div>
          {trip && trip.places.length > 0 && (
            <div
              style={{
                fontSize: 32,
                color: COLORS.sage,
                fontWeight: 700,
                display: "flex",
              }}
            >
              {`${trip.places.length} saved ${
                trip.places.length === 1 ? "place" : "places"
              }`}
            </div>
          )}
        </div>
      </OgFrame>
    ),
    size,
  );
}
