import { APP_STORE_URL } from "@/lib/appStore";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-background overflow-hidden pt-16">
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#2E2E2E 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center w-full">
        {/* Left — text */}
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-6">
            Available now on iOS
          </p>
          <h1
            className="font-headline font-extrabold uppercase leading-[0.9] tracking-tight text-dark mb-6"
            style={{ fontSize: "clamp(3.5rem, 8vw, 6.5rem)" }}
          >
            Travel is
            <br />
            built on
            <br />
            trust.
          </h1>
          <p className="text-dark/60 text-lg leading-relaxed mb-8 max-w-md font-sans">
            <strong>Safar</strong> is built for that reality. Instead of seeing thousands of people&apos;s opinions, only see the ones whose taste you trust.
          </p>
          <div className="flex lg:justify-start justify-center">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center gap-2 bg-accent text-white font-medium px-7 py-3.5 rounded-full hover:bg-dark transition-colors text-sm"
            >
              Download Now →
            </a>
          </div>
        </div>

        {/* Right — iPhone mockup */}
        <div className="flex justify-center lg:justify-end">
          <div
            className="relative rounded-[44px] border-[7px] border-dark shadow-2xl -rotate-3 overflow-hidden"
            style={{ width: "260px", background: "#1a1a1a" }}
          >
            <img src="/screenshots/newleaderboard.png" alt="Safar app" className="w-full block" />
          </div>
        </div>
      </div>
    </section>
  );
}
