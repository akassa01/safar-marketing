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
