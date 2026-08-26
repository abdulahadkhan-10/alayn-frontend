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
  { label: "About Alayn AI", href: "/about", desc: "Founding mission & hospitality philosophy" },
  { label: "Contact & Sales", href: "/contact", desc: "Book a demonstration & support" },
  { label: "Developer API Docs", href: "/api-docs", desc: "REST APIs, headers & webhooks" },
  { label: "Privacy Policy", href: "/legal/privacy", desc: "Data protection & compliance terms" },
  { label: "Terms of Service", href: "/legal/terms", desc: "Platform terms & agreements" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 bg-[#07080a] text-white relative overflow-hidden">
      <div className="max-w-2xl w-full mx-auto text-center relative z-10">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/whitelogo.png"
            alt="Alayn AI Logo"
            width={160}
            height={40}
            className="h-10 w-auto mx-auto object-contain"
          />
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
            HTTP 404 — NOT FOUND
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Page Not Located
        </h1>

        <p className="text-slate-400 text-sm sm:text-base font-light max-w-md mx-auto mb-8 leading-relaxed">
          The requested page does not exist. Use the directory below to navigate to valid platform sections.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
          {RECOVERY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-500/40 transition-all duration-200"
            >
              <div className="font-semibold text-sm text-white mb-0.5">{item.label}</div>
              <div className="text-xs text-slate-400 font-light">{item.desc}</div>
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-400">
          <Link href="/llms.txt" className="hover:text-amber-400 transition-colors">llms.txt</Link>
          <Link href="/llms-full.txt" className="hover:text-amber-400 transition-colors">llms-full.txt</Link>
          <Link href="/sitemap.xml" className="hover:text-amber-400 transition-colors">sitemap.xml</Link>
        </div>
      </div>
    </main>
  );
}
