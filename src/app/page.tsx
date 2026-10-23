import React from "react";
import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import SceneProgress from "@/components/landing/SceneProgress";
import SmoothScroll from "@/components/landing/motion/SmoothScroll";
import { GlobalFieldProvider } from "@/components/landing/motion/GlobalField";
import HeroScene from "@/components/landing/scenes/HeroScene";
import TrustedByScene from "@/components/landing/scenes/TrustedByScene";
import ChaosScene from "@/components/landing/scenes/ChaosScene";
import ConvergenceScene from "@/components/landing/scenes/ConvergenceScene";
import RunningScene from "@/components/landing/scenes/RunningScene";
import VerticalsScene from "@/components/landing/scenes/VerticalsScene";
import CalmScene from "@/components/landing/scenes/CalmScene";
import WaitingScene from "@/components/landing/scenes/WaitingScene";
import IntroReveal from "@/components/landing/IntroReveal";

const title = "Alayn AI: Restaurant Billing Software, POS, Inventory & Workforce OS";
const description =
  "GST billing software, counter & table POS, instant KOT, kitchen display (KDS), FEFO inventory, waste tracking, and staff scheduling in one platform for restaurants, cafés & cloud kitchens.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: "https://alaynai.com",
    types: { "text/markdown": "https://alaynai.com/index.md" },
  },
  ...socialMetadata({ title, description, path: "" }),
};

export default function LandingPage() {
  return (
    <SmoothScroll>
      <IntroReveal />
      <GlobalFieldProvider>
        <div className="landing-root">
          <LandingNav />
          <SceneProgress />
          <HeroScene />
          <TrustedByScene />
          <ChaosScene />
          <ConvergenceScene />
          <RunningScene />
          <VerticalsScene />
          <CalmScene />
          <WaitingScene />
          <LandingFooter />
        </div>
      </GlobalFieldProvider>
    </SmoothScroll>
  );
}
