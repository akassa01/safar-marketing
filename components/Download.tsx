import Image from "next/image";
import { APP_STORE_URL } from "@/lib/appStore";

export default function Download() {
  return (
    <section id="download" className="py-24 lg:py-36" style={{ background: "#2E2E2E" }}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-6">
          Free on the App Store
        </p>
        <h2
          className="font-headline font-extrabold uppercase leading-none text-white mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
        >
          Download
          <br />
          Safar.
        </h2>
        <p className="text-white/50 text-base font-sans mb-10 leading-relaxed">
          Never lose track of a recommendation again. Track the cities you&apos;ve been, save the
          places worth returning to, and see where the people you trust actually go.
        </p>

        <div className="flex justify-center">
          <a href={APP_STORE_URL} aria-label="Download Safar on the App Store">
            <Image
              src="/app-store-badge.svg"
              alt="Download on the App Store"
              width={180}
              height={53}
            />
          </a>
        </div>
      </div>
    </section>
  );
}
