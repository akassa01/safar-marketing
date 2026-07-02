import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const APP_STORE_URL = "https://apps.apple.com/app/id6759003685";

export const metadata: Metadata = {
  title: "A trip on Safar",
  description: "See this city and the places worth visiting on Safar — the social travel journal.",
};

// Fallback landing page for shared-city links. Users with the Safar app installed
// never reach this — iOS opens the app via the Universal Link (see the AASA file at
// /.well-known/apple-app-site-association). Everyone else lands here and is pointed
// to the App Store.
export default async function SharedCityPage({
  params,
}: {
  params: Promise<{ userId: string; cityId: string }>;
}) {
  // params is awaited to satisfy Next's async dynamic API contract even though the
  // v1 page is generic; the ids are available here if we later personalize it.
  await params;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center bg-background text-dark">
      <Image src="/logo.png" alt="Safar" width={96} height={96} className="rounded-2xl" priority />

      <div className="flex flex-col gap-3 max-w-md">
        <h1 className="font-headline text-4xl font-extrabold uppercase tracking-tight">
          A trip worth taking
        </h1>
        <p className="text-muted text-lg">
          Someone shared a city with you on Safar. Get the app to see their trip, the
          places they loved, and track your own travels.
        </p>
      </div>

      <Link href={APP_STORE_URL} aria-label="Download Safar on the App Store">
        <Image src="/app-store-badge.svg" alt="Download on the App Store" width={180} height={60} priority />
      </Link>

      <Link href="/" className="text-accent text-sm underline underline-offset-4">
        Learn more about Safar
      </Link>
    </main>
  );
}
