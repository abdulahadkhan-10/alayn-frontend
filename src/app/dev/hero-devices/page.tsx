import { notFound } from "next/navigation";
import { Phone, Tablet } from "@/components/landing/devices/DeviceFrames";

/**
 * Development preview page for the pure-vector Hero device lockup
 * (Space Black iPad Pro + Black Titanium iPhone 16 Pro).
 */
export default async function HeroDevicesPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { only } = await searchParams;

  return (
    <div style={{ padding: 80, maxWidth: 960, margin: "0 auto" }}>
      <div className="hero-stage">
        <div className="hero-tablet-wrap" style={only === "phone" ? { visibility: "hidden" } : undefined}>
          <Tablet />
        </div>
        <div className="hero-phone-wrap" style={only === "tablet" ? { visibility: "hidden" } : undefined}>
          <Phone />
        </div>
      </div>
    </div>
  );
}
