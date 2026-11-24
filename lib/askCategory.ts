export type AskCategory =
  | "restaurant"
  | "hotel"
  | "activity"
  | "shop"
  | "nightlife"
  | "other";

const MAP: Record<string, AskCategory> = {
  Restaurant: "restaurant",
  Cafe: "restaurant",
  Bakery: "restaurant",
  FoodMarket: "restaurant",
  Brewery: "restaurant",
  Winery: "restaurant",
  Hotel: "hotel",
  Nightlife: "nightlife",
  Store: "shop",
  Museum: "activity",
  Park: "activity",
  Beach: "activity",
  Theater: "activity",
  Landmark: "activity",
  NationalPark: "activity",
  Zoo: "activity",
  Aquarium: "activity",
  AmusementPark: "activity",
  Stadium: "activity",
};

/** Maps a MapKit POI category (for example "Cafe") to a Safar category. */
export function categoryFromPoi(poi: unknown): AskCategory {
  return typeof poi === "string" ? (MAP[poi] ?? "other") : "other";
}
