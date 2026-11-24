/** Mirrors the iOS `PlaceCategory` raw values and titles. */
export type CategoryKey =
  | "restaurant"
  | "hotel"
  | "activity"
  | "nightlife"
  | "shop"
  | "other";

export const CATEGORY_TITLES: Record<CategoryKey, string> = {
  restaurant: "Food & Drink",
  hotel: "Accommodation",
  activity: "Activities",
  nightlife: "Bars & Nightlife",
  shop: "Shops",
  other: "Other",
};

/**
 * Category colors, matching iOS `PlaceCategory.systemColor` (Place.swift). The
 * values are Apple's light-mode system colors, so a pin or swatch here is the
 * same color the app draws for that category.
 */
export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  restaurant: "#FF9500", // systemOrange
  hotel: "#AF52DE", // systemPurple
  activity: "#34C759", // systemGreen
  shop: "#FFCC00", // systemYellow
  nightlife: "#FF2D55", // systemPink
  other: "#007AFF", // systemBlue
};

/** Display order for grouped lists. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "restaurant",
  "hotel",
  "activity",
  "nightlife",
  "shop",
  "other",
];

/** Any unknown or missing value maps to `other`, like the app does. */
export function normalizeCategory(raw: string | null | undefined): CategoryKey {
  return raw && raw in CATEGORY_TITLES ? (raw as CategoryKey) : "other";
}
