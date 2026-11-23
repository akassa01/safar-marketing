import type { Metadata } from "next";
import PlaceCard from "@/components/place/PlaceCard";
import { getCatalogPlace, type SharedPlace } from "@/lib/sharedPlace";
import { placeMetadata } from "@/lib/placeMetadata";

type Params = Promise<{ id: string }>;

// Never throws: any failure resolves to the generic card.
async function load(params: Params): Promise<SharedPlace | null> {
  try {
    return await getCatalogPlace((await params).id);
  } catch {
    return null;
  }
}

// Landing for shared-place links carrying a catalog id (`getsafar.ca/place/{id}`).
// See PlaceCard for why app users never reach this page.
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  return placeMetadata(await load(params));
}

export default async function SharedPlaceByIdPage({
  params,
}: {
  params: Params;
}) {
  return <PlaceCard place={await load(params)} />;
}
