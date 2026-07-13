/**
 * Shared OpenGraph image building blocks (next/og ImageResponse JSX).
 * Ported from the sibling safar-web-app repo so shared-city links unfurl
 * with on-brand art. Brand: cream background, sage accents, charcoal text,
 * dotted world map from city / place coordinates (equirectangular projection).
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const COLORS = {
  cream: "#f8f6f2",
  charcoal: "#2e2e2e",
  sage: "#76846f",
  sageMuted: "#9ba896",
};

export function projectCoordinate(
  latitude: number,
  longitude: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const x = ((longitude + 180) / 360) * width;
  const y = ((90 - latitude) / 180) * height;
  return { x, y };
}

export function DotMap({
  coordinates,
  width = 1200,
  height = 630,
  dotSize = 14,
}: {
  coordinates: { latitude: number; longitude: number }[];
  width?: number;
  height?: number;
  dotSize?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        opacity: 0.9,
      }}
    >
      {coordinates.slice(0, 120).map((coordinate, i) => {
        const { x, y } = projectCoordinate(
          coordinate.latitude,
          coordinate.longitude,
          width,
          height,
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - dotSize / 2,
              top: y - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              backgroundColor: COLORS.sage,
              border: `3px solid ${COLORS.cream}`,
            }}
          />
        );
      })}
    </div>
  );
}

export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.cream,
        color: COLORS.charcoal,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 30,
          fontWeight: 700,
          color: COLORS.sage,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        Safar
      </div>
    </div>
  );
}
