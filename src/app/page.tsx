import React from "react";
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

export default function LandingPage() {
  return (
    <SmoothScroll>
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
