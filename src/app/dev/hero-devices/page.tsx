import { notFound } from "next/navigation";
import { Phone, Tablet } from "@/components/landing/devices/DeviceFrames";

/**
 * Development-only page that draws the hero's tablet and phone live, in 3D,
 * on a transparent background, so they can be baked into the images the
 * hero actually shows (public/hero-tablet-3d.webp and public/hero-phone-3d.webp).
 *
 * Why baked: a browser blurs small text when it draws a screenshot at an
 * angle. Rendering the tilted devices here at 4× and downscaling the result
 * once, with a high-quality filter, keeps the dashboard text sharp.
 *
 * To re-bake after new screenshots (public/hero-tablet.webp, hero-phone.webp):
 *   1. Open /dev/hero-devices?only=tablet in a browser at device scale 4
 *      (Playwright: deviceScaleFactor: 4) and screenshot #bake with a
 *      transparent background. Repeat with ?only=phone.
 *   2. Downscale each to 1852px wide (Lanczos) and save as WebP, quality 90.
 * Both images cover the same box, so they stack exactly in the hero.
 */
export default async function HeroDevicesBakePage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { only } = await searchParams;

  return (
    <>
      <style>{"html, body { background: transparent !important; }"}</style>
      {/* 726px is the hero's device column at a 1336px-wide window; the 100px
          margin leaves room for the shadows */}
      <div id="bake" style={{ width: 926, padding: 100 }}>
        <div className="hero-stage">
          <div className="hero-tablet-wrap" style={only === "phone" ? { visibility: "hidden" } : undefined}>
            <Tablet src="/hero-tablet.webp" alt="" />
          </div>
          <div className="hero-phone-wrap" style={only === "tablet" ? { visibility: "hidden" } : undefined}>
            <Phone src="/hero-phone.webp" alt="" />
          </div>
        </div>
      </div>
    </>
  );
}
