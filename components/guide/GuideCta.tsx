import Image from "next/image";
import { APP_STORE_URL } from "@/lib/appStore";

export default function GuideCta() {
  return (
    <section className="mt-14 rounded-2xl bg-accent/10 px-6 py-10 text-center">
      <p className="font-headline text-2xl font-extrabold uppercase tracking-tight">
        Keep your own map of places worth returning to.
      </p>
      <a
        href={APP_STORE_URL}
        aria-label="Download Safar on the App Store"
        className="mt-6 inline-block"
      >
        <Image src="/app-store-badge.svg" alt="Download on the App Store" width={160} height={53} />
      </a>
    </section>
  );
}
