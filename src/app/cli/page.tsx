import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Alayn CLI Tool — Official @alayn/cli Package on npm";
const description = "Official Command-Line Interface for Alayn AI. Automate restaurant POS, sync kitchen KDS, and manage inventory from terminal.";

export const metadata: Metadata = {
  title: "Official CLI Tool (@alayn/cli)",
  description,
  alternates: {
    canonical: `${siteUrl}/cli`,
  },
};

export default function CliPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-4xl mx-auto w-full">
        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
          DEVELOPER TOOLING
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          Official Alayn CLI (@alayn/cli)
        </h1>
        <p className="text-base text-slate-300 font-light leading-relaxed mb-10">
          The official <code className="text-amber-400">@alayn/cli</code> package on npm lets developers, sysadmins, and autonomous agents script interactions with the Alayn AI restaurant platform.
        </p>

        <section className="space-y-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-3">1. Installation</h2>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 space-y-2">
              <p># Install globally via npm</p>
              <p className="text-white">npm install -g @alayn/cli</p>
              <p className="mt-2 text-slate-400"># Or execute directly with npx</p>
              <p className="text-white">npx @alayn/cli --help</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-3">2. Core Commands</h2>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
              <p><span className="text-amber-400">alayn auth login</span> — Authenticate using your API key or credentials</p>
              <p><span className="text-amber-400">alayn orders list --outlet &lt;id&gt;</span> — Query active restaurant orders</p>
              <p><span className="text-amber-400">alayn orders stream --outlet &lt;id&gt;</span> — Stream live KDS kitchen tickets</p>
              <p><span className="text-amber-400">alayn inventory sync</span> — Export and sync FEFO ingredient levels</p>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
