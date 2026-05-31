"use client";
import { useState } from "react";

type Status = "idle" | "loading" | "success" | "already" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus(data.alreadyExists ? "already" : "success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="waitlist" className="py-24 lg:py-36" style={{ background: "#2E2E2E" }}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-6">
          Coming soon
        </p>
        <h2
          className="font-headline font-extrabold uppercase leading-none text-white mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
        >
          Join the
          <br />
          Waitlist.
        </h2>
        <p className="text-white/50 text-base font-sans mb-10 leading-relaxed">
          Never lose track of a recommendation again. Be part of the social travel journal built on trust.
        </p>

        {status === "success" && (
          <p className="text-white font-medium text-lg">
            You&apos;re on the list! We&apos;ll keep you in the loop as we work towards launch.
          </p>
        )}

        {status === "already" && (
          <p className="text-white font-medium text-lg">
            ✓ You&apos;re already on the list — we&apos;ll see you at launch!
          </p>
        )}

        {status !== "success" && status !== "already" && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 text-sm transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-full font-medium text-sm text-white transition-colors disabled:opacity-50 cursor-pointer"
                style={{ background: "#76846F" }}
              >
                {status === "loading" ? "Joining…" : "Join Waitlist →"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-red-400 text-sm mt-3">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
