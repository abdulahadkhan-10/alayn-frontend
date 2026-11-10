import Image from "next/image";

/**
 * A tablet and a phone drawn in CSS around real screenshots of the app.
 *
 * Each device is built like the real thing, from the outside in: a machined
 * metal rim, a black glass bezel, the screen, and a sheen of reflection over
 * the glass. Depth comes from the device's own body: identical thin layers
 * packed half a pixel apart behind the face (`.device-edge`), so when the hero
 * tilts the devices in 3D their side wall shows as one smooth surface. See the "Hero devices" block in globals.css.
 */

/**
 * The metal side wall. Every layer is the same colour: layers that changed
 * shade showed as a stepped double outline along the bottom edge.
 */
function Edge({ layers, radius }: { layers: number; radius: string }) {
  return (
    <>
      {Array.from({ length: layers }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="device-edge"
          style={{
            borderRadius: radius,
            transform: `translateZ(${-(i + 1) * 0.5}px)`,
          }}
        />
      ))}
    </>
  );
}

/** Light catching the glass: brighter at the top-left, gone by the middle. */
const Glare = () => <span aria-hidden className="device-glare" />;

/** iPad-style tablet in landscape. The screenshot is a 1180 × 820 tablet viewport captured at 2×. */
export function Tablet({ src, alt }: { src: string; alt: string }) {
  const radius = "clamp(16px, 3.4vw, 34px)";
  return (
    <div className="device device-tablet" style={{ borderRadius: radius }}>
      <Edge layers={12} radius={radius} />

      {/* Buttons on the rim: power on the top edge, volume on the right */}
      <span aria-hidden className="device-button" style={{ top: "-0.45%", right: "9%", width: "8%", height: "4px" }} />
      <span aria-hidden className="device-button" style={{ right: "-0.35%", top: "11%", width: "4px", height: "7%" }} />
      <span aria-hidden className="device-button" style={{ right: "-0.35%", top: "20%", width: "4px", height: "7%" }} />

      <div className="device-face device-rim" style={{ borderRadius: radius }}>
        <div className="device-bezel" style={{ borderRadius: `calc(${radius} - 2px)`, padding: "2.6%" }}>
          {/* Front camera, on the long edge as on current iPads */}
          <span aria-hidden className="device-camera" style={{ top: "1.85%", left: "50%", width: "0.9%" }} />
          <div className="device-screen" style={{ borderRadius: "clamp(4px, 0.8vw, 10px)" }}>
            <Image
              src={src}
              alt={alt}
              width={2360}
              height={1640}
              // Served as captured: the optimiser resized it to 680px and
              // re-compressed it at 75% quality, which blurred the small text
              unoptimized
              loading="eager"
              fetchPriority="high"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Glare />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Status-bar glyphs drawn to match iOS: signal bars, Wi-Fi and battery. */
function StatusBar() {
  return (
    <div className="device-status" aria-hidden>
      <span className="device-status-time">9:41</span>
      <span className="device-status-icons">
        <svg viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <svg viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.4 8.4 0 0 1 6-2.4Z" />
          <path d="M8 5.6c1.4 0 2.7.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 3.8c-1.9 0-3.6.7-4.8 1.9L4.4 7A5.2 5.2 0 0 1 8 5.6Z" />
          <path d="M8 9.1c.5 0 .9.2 1.3.5L8 11 6.7 9.6c.4-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg viewBox="0 0 27 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="1.9" fill="currentColor" />
          <path d="M24.5 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

/** Phone in black titanium, with the Dynamic Island and the side buttons. Screenshot is 390 × 844 CSS pixels. */
export function Phone({ src, alt }: { src: string; alt: string }) {
  const radius = "17% / 7.9%";
  return (
    <div className="device device-phone" style={{ borderRadius: radius }}>
      <Edge layers={10} radius={radius} />

      {/* Action button and volume on the left, side button on the right */}
      <span aria-hidden className="device-button" style={{ left: "-1.6%", top: "17%", width: "3px", height: "4.5%" }} />
      <span aria-hidden className="device-button" style={{ left: "-1.6%", top: "24.5%", width: "3px", height: "8%" }} />
      <span aria-hidden className="device-button" style={{ left: "-1.6%", top: "34%", width: "3px", height: "8%" }} />
      <span aria-hidden className="device-button" style={{ right: "-1.6%", top: "27%", width: "3px", height: "12%" }} />

      <div className="device-face device-rim device-rim-phone" style={{ borderRadius: radius }}>
        <div className="device-bezel" style={{ borderRadius: "15.5% / 7.2%", padding: "4.2%" }}>
          <div className="device-screen" style={{ borderRadius: "12.5% / 5.8%", aspectRatio: "390 / 844" }}>
            <StatusBar />
            <span aria-hidden className="device-island" />
            <Image
              src={src}
              alt={alt}
              width={551}
              height={1192}
              // Served as captured; the optimiser sent a 200px copy
              unoptimized
              loading="eager"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <span aria-hidden className="device-home-bar" />
            <Glare />
          </div>
        </div>
      </div>
    </div>
  );
}
