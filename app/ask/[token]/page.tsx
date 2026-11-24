import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GuideNav from "@/components/guide/GuideNav";
import AskForm from "@/components/ask/AskForm";
import { getAskRequest, type AskLookup } from "@/lib/askRequest";

type Params = Promise<{ token: string }>;

// Never throws: an unexpected failure resolves to `error`, not `closed`.
async function load(params: Params): Promise<AskLookup> {
  try {
    const { token } = await params;
    return await getAskRequest(token);
  } catch {
    return { status: "error" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const lookup = await load(params);
  const robots = { index: false, follow: false };
  if (lookup.status !== "open") {
    const title = "Ask friends on Safar";
    const description = "Friends share the places they love in a city.";
    return { title, description, robots, openGraph: { title, description } };
  }
  const { ask } = lookup;
  const title = `Help ${ask.requesterName} plan ${ask.cityName} on Safar`;
  const description = `Share a place you love in ${ask.cityName}. It takes under a minute.`;
  return { title, description, robots, openGraph: { title, description } };
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-background text-dark">
      <GuideNav />
      <main className="mx-auto flex max-w-[680px] flex-col items-center gap-6 px-4 pb-16 pt-16 text-center">
        <Image src="/logo.png" alt="Safar" width={64} height={64} className="rounded-2xl" />
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-4xl font-extrabold uppercase tracking-tight">
            {title}
          </h1>
          <p className="text-muted">{body}</p>
        </div>
        <Link href="/" className="text-sm text-accent underline underline-offset-4">
          Learn more about Safar
        </Link>
      </main>
    </div>
  );
}

export default async function AskPage({ params }: { params: Params }) {
  const lookup = await load(params);
  if (lookup.status === "closed") {
    return (
      <Notice
        title="This link is no longer open"
        body="Ask your friend to send you a new one."
      />
    );
  }
  if (lookup.status === "error") {
    return (
      <Notice
        title="Couldn't load this page"
        body="Something went wrong on our end. Refresh in a moment to try again."
      />
    );
  }
  const { ask } = lookup;
  const { token } = await params;
  const region = [ask.cityName, ask.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background text-dark">
      <GuideNav />
      <main className="mx-auto max-w-[680px] px-4 pb-16 pt-6">
        <header>
          <h1 className="font-headline text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl">
            {ask.requesterName} is heading to {ask.cityName}
          </h1>
          <p className="mt-2 text-muted">{region}</p>
          {ask.promptNote && (
            <blockquote className="mt-5 whitespace-pre-line border-l-2 border-accent/40 pl-4 text-base leading-relaxed text-dark/80">
              {ask.promptNote}
            </blockquote>
          )}
        </header>
        <AskForm
          token={token}
          requesterName={ask.requesterName}
          cityName={ask.cityName}
          center={
            ask.latitude !== null && ask.longitude !== null
              ? { lat: ask.latitude, lng: ask.longitude }
              : null
          }
        />
      </main>
    </div>
  );
}
