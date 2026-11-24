import type { Metadata } from "next";
import PlaceCard from "@/components/place/PlaceCard";
import { placeFromQuery } from "@/lib/sharedPlace";
import { placeMetadata } from "@/lib/placeMetadata";

type SearchParams = Promise<{ n?: string; lat?: string; lng?: string }>;

// Landing for shared-place links carrying the name+coords fallback identity
// (`getsafar.ca/place?n=&lat=&lng=&mk=`). See PlaceCard for why app users
// never reach this page.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return placeMetadata(placeFromQuery(await searchParams));
}

export default async function SharedPlacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <PlaceCard place={placeFromQuery(await searchParams)} />;
}
