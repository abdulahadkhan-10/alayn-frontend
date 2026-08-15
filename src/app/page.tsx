import React from "react";
import dynamic from "next/dynamic";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import SceneProgress from "@/components/landing/SceneProgress";
import SmoothScroll from "@/components/landing/motion/SmoothScroll";
import { GlobalFieldProvider } from "@/components/landing/motion/GlobalField";
import HeroScene from "@/components/landing/scenes/HeroScene";
import TrustedByScene from "@/components/landing/scenes/TrustedByScene";

// Dynamic imports for below-the-fold scenes to enable code splitting
const ChaosScene = dynamic(() => import("@/components/landing/scenes/ChaosScene"));
const ConvergenceScene = dynamic(() => import("@/components/landing/scenes/ConvergenceScene"));
const RunningScene = dynamic(() => import("@/components/landing/scenes/RunningScene"));
const VerticalsScene = dynamic(() => import("@/components/landing/scenes/VerticalsScene"));
const CalmScene = dynamic(() => import("@/components/landing/scenes/CalmScene"));
const WaitingScene = dynamic(() => import("@/components/landing/scenes/WaitingScene"));

export default function LandingPage() {
  return (
    <SmoothScroll>
      <GlobalFieldProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  "name": "Alayn AI",
                  "operatingSystem": "Web",
                  "applicationCategory": "BusinessApplication",
                  "description": "Alayn is an AI-powered operating system for modern businesses, specifically designed for restaurants and cafes in India to manage staff, inventory, and orders.",
                  "url": "https://alaynai.com",
                  "creator": {
                    "@type": "Organization",
                    "name": "BRAHM Global Holdings",
                  }
                },
                {
                  "@type": "Organization",
                  "name": "Alayn AI",
                  "url": "https://alaynai.com",
                  "logo": "https://alaynai.com/alaynlogo.png",
                  "sameAs": [
                    "https://www.instagram.com/alayn.ai/"
                  ],
                  "parentOrganization": {
                    "@type": "Organization",
                    "name": "BRAHM Global Holdings"
                  }
                }
              ]
            }),
          }}
        />
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
