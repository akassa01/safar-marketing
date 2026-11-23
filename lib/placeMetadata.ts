import type { Metadata } from "next";
import type { SharedPlace } from "@/lib/sharedPlace";

/** Shared metadata for both place routes. Noindex by design. */
export function placeMetadata(place: SharedPlace | null): Metadata {
  const title = place
    ? place.cityLabel
      ? `${place.name} in ${place.cityLabel.split(",")[0]} on Safar`
      : `${place.name} on Safar`
    : "A place worth visiting on Safar";
  const description = place
    ? "Save this spot to your map on Safar."
    : "Someone shared a place with you on Safar. Get the app to see it and save it to your trips.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
