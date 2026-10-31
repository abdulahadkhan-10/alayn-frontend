import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "404 — Page Not Found | Alayn AI",
  description: "The requested resource could not be found on Alayn AI.",
  robots: {
    index: false,
    follow: true,
  },
};

const RECOVERY_LINKS = [
  { label: "Home", href: "/", desc: "Platform overview & demo booking" },
  { label: "Pricing", href: "/pricing", desc: "Alayn Basic & Pro per-outlet plans" },
  { label: "Features", href: "/features", desc: "POS, KDS, inventory & workforce" },
  { label: "About Alayn AI", href: "/about", desc: "Founding mission & hospitality philosophy" },
  { label: "Contact & Sales", href: "/contact", desc: "Book a demonstration & support" },
  { label: "Developer API Docs", href: "/api-docs", desc: "REST APIs, headers & OpenAPI spec" },
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--cream-light)] px-4 py-20 text-[var(--espresso)] selection:bg-[var(--amber)] selection:text-white sm:px-6">
      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <Link
          href="/"
          className="mb-8 inline-flex rounded-xl border border-[var(--border-warm)] bg-white px-5 py-3 shadow-xs transition-colors hover:border-[var(--espresso)]/25"
        >
          <Image
            src="/alayn-logo-tm.png"
            alt="Alayn AI Logo"
            width={960}
            height={188}
            className="mx-auto h-7 w-auto object-contain"
          />
        </Link>

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-warm)] bg-white px-3.5 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--amber)]" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--amber)]">
              HTTP 404 — NOT FOUND
            </span>
          </div>
        </div>

        <h1 className="hero-headline mb-4 text-balance text-3xl sm:text-5xl">
          Page Not Located
        </h1>

        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
          The requested page does not exist. Use the directory below to navigate to valid platform sections.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {RECOVERY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[var(--border-warm)] bg-white p-4 transition-colors hover:border-[var(--espresso)]/30"
            >
              <div className="mb-0.5 font-heading text-sm font-bold text-[var(--espresso)]">{item.label}</div>
              <div className="text-xs text-[var(--muted)]">{item.desc}</div>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 border-t border-[var(--border-warm)] pt-6 font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          <Link href="/llms.txt" className="transition-colors hover:text-[var(--amber)]">llms.txt</Link>
          <Link href="/llms-full.txt" className="transition-colors hover:text-[var(--amber)]">llms-full.txt</Link>
          <Link href="/sitemap.xml" className="transition-colors hover:text-[var(--amber)]">sitemap.xml</Link>
        </div>
      </div>
    </main>
  );
}
