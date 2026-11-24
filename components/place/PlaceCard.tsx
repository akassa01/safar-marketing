import { CATEGORY_COLORS } from "@/lib/placeCategories";
import Image from "next/image";
import Link from "next/link";
import GuideMap from "@/components/GuideMap";
import { APP_STORE_URL } from "@/lib/appStore";
import type { SharedPlace } from "@/lib/sharedPlace";

// Shared landing for shared-place links, used by both `/place/{id}` (catalog
// id) and `/place` (name+coords fallback). Users with the Safar app never
// reach it: iOS opens the app via the Universal Link (see
// /.well-known/apple-app-site-association).
export default function PlaceCard({ place }: { place: SharedPlace | null }) {
  const badge = (
    <a href={APP_STORE_URL} aria-label="Download Safar on the App Store">
      <Image src="/app-store-badge.svg" alt="Download on the App Store" width={160} height={53} />
    </a>
  );

  if (!place) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center text-dark">
        <Image src="/logo.png" alt="Safar" width={96} height={96} className="rounded-2xl" priority />
        <div className="flex max-w-md flex-col gap-3">
          <h1 className="font-headline text-4xl font-extrabold uppercase tracking-tight">
            A place worth visiting
          </h1>
          <p className="text-lg text-muted">
            Someone shared a place with you on Safar. Get the app to see it,
            save it to your bucket list, and keep track of your own travels.
          </p>
        </div>
        {badge}
        <Link href="/" className="text-sm text-accent underline underline-offset-4">
          Learn more about Safar
        </Link>
      </main>
    );
  }

  const appleMaps = `https://maps.apple.com/?ll=${place.latitude},${place.longitude}&q=${encodeURIComponent(place.name)}`;

  return (
    <div className="min-h-screen bg-background text-dark">
      <nav className="mx-auto flex h-14 max-w-[680px] items-center justify-between px-4">
        <Link href="/" aria-label="Safar home">
          <Image src="/logo.png" alt="Safar" width={36} height={36} className="rounded-lg" priority />
        </Link>
        <a
          href={APP_STORE_URL}
          className="rounded-full border border-dark/20 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-dark hover:text-background"
        >
          Get the app
        </a>
      </nav>

      <main className="mx-auto max-w-[680px] px-4 pb-16 pt-4">
        {place.category && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            {place.categoryKey && (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[place.categoryKey] }}
              />
            )}
            {place.category}
          </span>
        )}
        <h1 className="mt-3 font-headline text-5xl font-extrabold uppercase leading-none tracking-tight">
          {place.name}
        </h1>
        {place.cityLabel && <p className="mt-2 text-muted">{place.cityLabel}</p>}

        <GuideMap
          className="mt-6"
          center={{ lat: place.latitude, lng: place.longitude }}
          pins={[
            {
              id: 1,
              name: place.name,
              lat: place.latitude,
              lng: place.longitude,
              color: place.categoryKey ? CATEGORY_COLORS[place.categoryKey] : undefined,
            },
          ]}
          cityLabel={place.cityLabel ?? place.name}
        />

        <a
          href={appleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full border border-dark/20 px-5 py-2 text-sm font-medium transition-colors hover:bg-dark hover:text-background"
        >
          Open in Apple Maps
        </a>

        <section className="mt-12 rounded-2xl bg-accent/10 px-6 py-10 text-center">
          <p className="font-headline text-2xl font-extrabold uppercase tracking-tight">
            Save this spot to your map on Safar
          </p>
          <div className="mt-6 flex justify-center">{badge}</div>
        </section>
      </main>
    </div>
  );
}
