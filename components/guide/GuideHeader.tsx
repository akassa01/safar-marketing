import type { SharedTrip } from "@/lib/sharedTrip";

/** First word of a full name, or `@username`, or null. */
function attribution(trip: SharedTrip): string | null {
  const first = trip.sharer?.fullName?.split(/\s+/)[0];
  if (first) return `${first}'s guide to ${trip.cityName}`;
  if (trip.sharer?.username) {
    return `@${trip.sharer.username}'s guide to ${trip.cityName}`;
  }
  return null;
}

export default function GuideHeader({ trip }: { trip: SharedTrip }) {
  const region = [trip.admin, trip.country].filter(Boolean).join(", ");
  const byline = attribution(trip) ?? `A guide to ${trip.cityName}`;
  const { photo, sharer } = trip;

  return (
    <header>
      <div className="relative h-52 overflow-hidden rounded-2xl bg-accent/15 sm:h-64">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={trip.cityName}
            className="h-full w-full object-cover"
          />
        )}
        {photo?.photographer && (
          <p className="absolute bottom-2 right-3 rounded-full bg-dark/55 px-2.5 py-0.5 text-[11px] text-white">
            Photo by{" "}
            {photo.unsplashUrl ? (
              <a
                href={photo.unsplashUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {photo.photographer}
              </a>
            ) : (
              photo.photographer
            )}{" "}
            on Unsplash
          </p>
        )}
      </div>

      <h1 className="mt-6 font-headline text-5xl font-extrabold uppercase leading-none tracking-tight">
        {trip.cityName}
      </h1>
      {region && <p className="mt-2 text-muted">{region}</p>}

      <div className="mt-5 flex items-center gap-3">
        {sharer?.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sharer.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full bg-accent/15 object-cover"
          />
        )}
        <p className="text-sm font-medium">{byline}</p>
      </div>

      {trip.tripNote && (
        <blockquote className="mt-6 whitespace-pre-line border-l-2 border-accent/40 pl-4 text-base leading-relaxed text-dark/80">
          {trip.tripNote}
        </blockquote>
      )}
    </header>
  );
}
