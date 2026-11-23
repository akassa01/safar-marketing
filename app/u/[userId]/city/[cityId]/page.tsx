import type { Metadata } from "next";
import { getSharedTrip, type SharedTrip } from "@/lib/sharedTrip";
import GuideNav from "@/components/guide/GuideNav";
import GuideHeader from "@/components/guide/GuideHeader";
import GuidePlaces from "@/components/guide/GuidePlaces";
import GuideCta from "@/components/guide/GuideCta";
import GuideUnavailable from "@/components/guide/GuideUnavailable";

type Params = Promise<{ userId: string; cityId: string }>;

// Never throws: any data failure resolves to null and renders the fallback.
async function load(params: Params): Promise<SharedTrip | null> {
  try {
    const { userId, cityId } = await params;
    return await getSharedTrip(userId, cityId);
  } catch {
    return null;
  }
}

// The sibling `opengraph-image.tsx` route supplies the picture; this sets the
// text. Both degrade to generic Safar copy when data is unavailable.
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const trip = await load(params);
  const robots = { index: false, follow: false };

  if (!trip) {
    const title = "A guide on Safar";
    const description =
      "Keep track of the cities you have visited and the places you loved.";
    return { title, description, robots, openGraph: { title, description } };
  }

  const first = trip.sharer?.fullName?.split(/\s+/)[0];
  const who = first ?? (trip.sharer?.username ? `@${trip.sharer.username}` : null);
  const title = who
    ? `${who}'s guide to ${trip.cityName}`
    : `A guide to ${trip.cityName}`;
  const count = trip.guidePlaces.length;
  const description =
    count > 0
      ? `${count} ${count === 1 ? "place" : "places"} to try in ${trip.cityName}, saved on Safar.`
      : `A guide to ${trip.cityName} on Safar.`;

  return {
    title,
    description,
    robots,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Web guide for shared-city links. Users with the Safar app installed never
// reach this: iOS opens the app via the Universal Link (see the AASA file at
// /.well-known/apple-app-site-association). Everyone else reads the guide here.
export default async function SharedCityPage({ params }: { params: Params }) {
  const trip = await load(params);
  if (!trip) return <GuideUnavailable />;

  const cityLabel = [trip.cityName, trip.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background text-dark">
      <GuideNav />
      <main className="mx-auto max-w-[680px] px-4 pb-16 pt-2">
        <GuideHeader trip={trip} />
        <GuidePlaces
          places={trip.guidePlaces}
          center={{ lat: trip.latitude, lng: trip.longitude }}
          cityLabel={cityLabel}
        />
        <GuideCta />
      </main>
    </div>
  );
}
