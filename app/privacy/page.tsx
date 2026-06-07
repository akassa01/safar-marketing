import type { Metadata } from "next";
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Safar",
  description: "Privacy policy for the Safar app.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen font-sans" style={{ background: "#2E2E2E", color: "#fff" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="font-display text-4xl font-extrabold uppercase tracking-tight mb-2"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          Privacy Policy
        </h1>
        <p className="text-white/40 text-sm mb-12">Last updated: June 6, 2026</p>

        <Section title="Overview">
          Safar (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a travel tracking and
          discovery app. This policy explains what data we collect, how we use it, and your choices.
          By using Safar, you agree to this policy.
        </Section>

        <Section title="Information We Collect">
          <SubSection title="Account Information">
            When you create an account we collect your name, email address, and a username you
            choose. If you sign in with Apple, Apple may provide a private relay email address
            instead of your real one. We also store a hashed (irreversible) version of your email
            address so that people who already have your email saved in their contacts can find you
            through the &ldquo;Find Friends&rdquo; feature. This hash is used only for matching and
            is never shown to other users.
          </SubSection>
          <SubSection title="Profile Data">
            You may optionally add a profile photo and bio. This information is visible to other
            Safar users.
          </SubSection>
          <SubSection title="Travel Data">
            We store the cities you mark as visited or add to your bucket list, your ratings and
            notes for those cities, and places (restaurants, hotels, activities, etc.) you save
            within those cities.
          </SubSection>
          <SubSection title="Social Activity">
            We store follows, likes, and comments you create. Trip posts generated when you mark a
            city as visited are visible to your followers.
          </SubSection>
          <SubSection title="Phone Number">
            You may optionally provide your phone number to help others find you via the &ldquo;Find
            Friends&rdquo; feature. We store a hashed version of your number for matching and, if
            provided, the number itself on your profile. Your phone number is never shared with other
            users or third parties beyond what is described in this policy.
          </SubSection>
          <SubSection title="Contacts (optional)">
            With your permission, we read phone numbers and email addresses from your device contacts
            to identify which of your contacts are also on Safar. These phone numbers and email
            addresses are hashed on your device before being sent to our servers; raw contact data is
            never transmitted or stored. You can revoke this permission at any time in your device
            Settings.
          </SubSection>
          <SubSection title="Usage Data">
            We may collect basic app usage information (e.g., crash logs, session replays) to
            improve the app. Text inputs are masked in session recordings. We do not sell this data.
          </SubSection>
        </Section>

        <Section title="How We Use Your Information">
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>Provide and operate the Safar app and its social features</li>
            <li>Display your profile and travel data to users you follow or who follow you</li>
            <li>Send essential account-related communications (e.g., password reset)</li>
            <li>Improve app performance and fix bugs</li>
          </ul>
          <p className="mt-4 text-white/70">
            We do <strong className="text-white">not</strong> sell your personal data to third
            parties, and we do not use your data for advertising.
          </p>
        </Section>

        <Section title="Data Sharing">
          <p className="text-white/70 mb-3">
            We share data only as needed to operate the app:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>
              <strong className="text-white">Supabase</strong> — our backend provider (auth,
              database, and file storage). Data is stored securely on Supabase infrastructure.
            </li>
            <li>
              <strong className="text-white">Apple</strong> — if you use Sign in with Apple, Apple
              processes your authentication.
            </li>
            <li>
              <strong className="text-white">PostHog</strong> — we use PostHog for product analytics
              and session replay to understand how the app is used and fix issues. Text inputs are
              masked in all recordings. See{" "}
              <a
                href="https://posthog.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-white/80 hover:text-white"
              >
                PostHog&apos;s privacy policy
              </a>
              .
            </li>
          </ul>
          <p className="mt-4 text-white/70">
            We may share aggregated or de-identified information &mdash; data that has been combined
            or stripped of identifiers so that it cannot reasonably be used to identify you &mdash;
            with partners or for research, analytics, and business purposes. This never includes your
            contact data or the hashed phone numbers and email addresses used for friend matching.
          </p>
          <p className="mt-4 text-white/70">
            We do not sell or share your personal information with advertisers or data brokers.
          </p>
        </Section>

        <Section title="Data Retention & Deletion">
          We retain your data as long as your account is active. You can delete your account at any
          time by contacting us at{" "}
          <a href="mailto:support@getsafar.ca" className="underline text-white/80 hover:text-white">
            support@getsafar.ca
          </a>
          . Upon deletion, your profile, cities, places, posts, and social data will be permanently
          removed.
        </Section>

        <Section title="Security">
          We use industry-standard security practices, including encrypted connections (TLS) and
          Supabase&apos;s row-level security, to protect your data. No system is 100% secure; use a
          strong, unique password.
        </Section>

        <Section title="Your Rights">
          Depending on your location, you may have rights to access, correct, or delete your
          personal data. To exercise any of these rights, email us at{" "}
          <a href="mailto:support@getsafar.ca" className="underline text-white/80 hover:text-white">
            support@getsafar.ca
          </a>
          .
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. We will post the revised policy here with an
          updated date. Continued use of the app after changes constitutes acceptance.
        </Section>

        <Section title="Contact">
          If you have questions about this policy, contact us at{" "}
          <a href="mailto:support@getsafar.ca" className="underline text-white/80 hover:text-white">
            support@getsafar.ca
          </a>
          .
        </Section>

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
            ← Back to Safar
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2
        className="text-xl font-extrabold uppercase tracking-tight mb-3"
        style={{ fontFamily: "var(--font-barlow-condensed)" }}
      >
        {title}
      </h2>
      <div className="text-white/70 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
