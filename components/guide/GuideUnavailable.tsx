import Image from "next/image";
import Link from "next/link";
import { APP_STORE_URL } from "@/lib/appStore";

/** Branded fallback for unknown or unreadable guides. Renders with HTTP 200. */
export default function GuideUnavailable() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center text-dark">
      <Image src="/logo.png" alt="Safar" width={80} height={80} className="rounded-2xl" priority />
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="font-headline text-4xl font-extrabold uppercase tracking-tight">
          This guide isn&apos;t available
        </h1>
        <p className="text-lg text-muted">
          The link may be out of date. Safar helps you keep track of the cities
          you have visited and the places you loved.
        </p>
      </div>
      <a href={APP_STORE_URL} aria-label="Download Safar on the App Store">
        <Image src="/app-store-badge.svg" alt="Download on the App Store" width={160} height={53} />
      </a>
      <Link href="/" className="text-sm text-accent underline underline-offset-4">
        Learn more about Safar
      </Link>
    </main>
  );
}
