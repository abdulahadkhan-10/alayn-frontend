"use client";

import React, { useState } from "react";

const DEMO_EMAIL = "info@alaynai.com";

const OUTLET_OPTIONS = ["1 outlet", "2–5 outlets", "6–20 outlets", "More than 20 outlets"];

const inputClass =
  "w-full rounded-xl border border-[var(--border-warm)] bg-[var(--cream-light)]/60 px-4 py-3 text-sm text-[var(--espresso)] placeholder:text-[var(--muted)]/70 focus:border-[var(--amber)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--amber)]/20 transition-colors";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--espresso)] mb-2";

// There is no lead endpoint yet, so the form composes an email in the
// visitor's mail app. Swap handleSubmit for a POST when one exists.
export default function DemoRequestForm() {
  const [opened, setOpened] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();

    const restaurant = field("restaurant");
    const lines = [
      `Name: ${field("name")}`,
      `Restaurant / brand: ${restaurant}`,
      `Phone: ${field("phone")}`,
      `City: ${field("city") || "-"}`,
      `Outlets: ${field("outlets")}`,
      "",
      field("message") || "I'd like to see a demonstration of Alayn AI.",
    ];

    const subject = `Demonstration request: ${restaurant}`;
    window.location.href = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setOpened(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="demo-form-title"
      className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-9"
    >
      <h2 id="demo-form-title" className="mb-2 font-heading text-xl font-bold tracking-[-0.015em] text-[var(--espresso)] sm:text-2xl">
        Book a demonstration
      </h2>
      <p className="mb-6 text-[15px] leading-relaxed text-[var(--muted)]">
        Tell us a little about your restaurant and we&apos;ll get back to you within 24 hours to arrange a time.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demo-name" className={labelClass}>Your name</label>
          <input id="demo-name" name="name" type="text" required autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="demo-restaurant" className={labelClass}>Restaurant or brand</label>
          <input id="demo-restaurant" name="restaurant" type="text" required autoComplete="organization" className={inputClass} />
        </div>
        <div>
          <label htmlFor="demo-phone" className={labelClass}>Phone</label>
          <input id="demo-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="demo-city" className={labelClass}>City</label>
          <input id="demo-city" name="city" type="text" autoComplete="address-level2" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="demo-outlets" className={labelClass}>Number of outlets</label>
          <select id="demo-outlets" name="outlets" required defaultValue={OUTLET_OPTIONS[0]} className={inputClass}>
            {OUTLET_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-white text-[var(--espresso)]">{o}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="demo-message" className={labelClass}>What would you like to see? (optional)</label>
          <textarea id="demo-message" name="message" rows={3} className={`${inputClass} resize-y`} />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--espresso)] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--espresso-mid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)] sm:w-auto"
      >
        Request a demonstration
      </button>

      <p className="mt-4 text-xs text-[var(--muted)]" role="status" aria-live="polite">
        {opened
          ? `Your email app should now be open with the request filled in. Press send, or write to ${DEMO_EMAIL} directly.`
          : `This opens your email app with the details filled in, addressed to ${DEMO_EMAIL}.`}
      </p>
    </form>
  );
}
