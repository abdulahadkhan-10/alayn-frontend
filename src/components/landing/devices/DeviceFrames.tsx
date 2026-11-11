import React, { useId } from "react";

/**
 * Pure-vector Apple-grade hardware frames (Space Black iPad Pro in landscape
 * and Black Titanium iPhone 16 Pro in portrait) + vector Overview screens.
 *
 * Why pure vector SVG instead of raster screenshots or CSS 3D transforms:
 *  1. Zero blur at any zoom level (100% -> 500%+ browser zoom or trackpad
 *     pinch-zoom), because every glyph, hairline, icon, logo mark, and bezel
 *     chamfer is rendered directly from mathematical vector geometry.
 *  2. True concentric industrial hardware curves (R_inner = R_outer - inset),
 *     anodized titanium multi-stop specular bevels, recessed diamond-cut seams,
 *     and optical sapphire camera lenses — matching top-tier product pages.
 */

const UI_FONT = "var(--font-sans), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/**
 * Exact vector reproduction of /public/alayn-logo-tm.png (960 x 188),
 * traced directly from the registered trademark artwork so it stays razor-sharp
 * at any magnification.
 */
function AlaynLogoVector({ x, y, height }: { x: number; y: number; height: number }) {
  const scale = height / 188;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} aria-hidden="true">
      {/* Red ascending stroke */}
      <path
        d="M145 1 L40.5 173.5 C34 181.5 26.5 186 18 186 L0 186 L101 22 C108 9.5 117 1 128 1 Z"
        fill="#BB173D"
      />
      {/* Navy lower leg */}
      <path
        d="M109 77 L129 77 C137 77 143 81.5 148.5 90.5 L207 186 L190 186 C181 186 173.5 181 167.5 171 Z"
        fill="#023175"
      />
      {/* Vertical divider */}
      <rect x="273" y="31" width="4.5" height="156" fill="#023175" />
      {/* A L A Y N wordmark + TM */}
      <g fill="#023175">
        <path d="M382.5 80 L387.5 80 L423 145 L411.5 145 L385 97 L358.5 145 L346 145 Z" />
        <path d="M482 80 L492.5 80 L492.5 135.5 L534 135.5 L534 145 L482 145 Z" />
        <path d="M619.5 80 L624.5 80 L660 145 L648.5 145 L622 97 L595.5 145 L583 145 Z" />
        <path d="M699 80 L712.5 80 L734 107 L755.5 80 L769 80 L739.5 116.5 L739.5 145 L728.5 145 L728.5 116.5 Z" />
        <path d="M824 80 L830 80 L880.5 123.5 L880.5 80 L891 80 L891 145 L885.5 145 L834.5 101 L834.5 145 L824 145 Z" />
        <path d="M897 80 L921 80 L921 85 L911.5 85 L911.5 112 L906 112 L906 85 L897 85 Z" />
        <path d="M925 80 L931 80 L942.5 103 L954 80 L960 80 L960 112 L955 112 L955 89 L944 111 L941 111 L930 89 L930 112 L925 112 Z" />
      </g>
    </g>
  );
}

/** Trend badge used on both Tablet and Phone KPI cards */
function TrendBadge({
  x,
  y,
  label,
  positive,
  upArrow = true,
}: {
  x: number;
  y: number;
  label: string;
  positive: boolean;
  upArrow?: boolean;
}) {
  const width = Math.max(68, 35 + label.length * 7.2);
  const bg = positive ? "#ECFDF5" : "#FFF1F2";
  const border = positive ? "#A7F3D0" : "#FECDD3";
  const fg = positive ? "#047857" : "#BE123C";

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height="22" rx="11" fill={bg} stroke={border} strokeWidth="1" />
      {upArrow ? (
        <path
          d="M9 14.2 L13.2 10 L15.7 12.5 L19.5 8.7 M16.4 8.7 H19.5 V11.8"
          fill="none"
          stroke={fg}
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9 8.8 L13.2 13 L15.7 10.5 L19.5 14.3 M16.4 14.3 H19.5 V11.2"
          fill="none"
          stroke={fg}
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        x="24"
        y="14.8"
        fill={fg}
        fontSize="11"
        fontWeight="600"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label}
      </text>
    </g>
  );
}

/** Small top-right diagonal link arrow on KPI cards */
function CardCornerArrow({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y + 8} L${x + 8} ${y} M${x + 2.5} ${y} H${x + 8} V${y + 5.5}`}
      fill="none"
      stroke="#94A3B8"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Sidebar icon helper (16x16 box) */
function SidebarNavRow({
  y,
  label,
  icon,
}: {
  y: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <g transform={`translate(22, ${y})`}>
      <g fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </g>
      <text x="26" y="12" fill="#CBD5E1" fontSize="12.2" fontWeight="500">
        {label}
      </text>
    </g>
  );
}

/**
 * Space Black iPad Pro in landscape around the live vector Alayn Overview screen.
 */
export function Tablet({ alt = "Alayn dashboard on a tablet: net sales, orders, average order value, stock wasted and action items" }: { src?: string; alt?: string }) {
  const uid = useId().replace(/:/g, "");
  const rimGrad = `tab-rim-${uid}`;
  const edgeHighlight = `tab-hi-${uid}`;
  const btnGradH = `tab-btnh-${uid}`;
  const btnGradV = `tab-btnv-${uid}`;
  const camLens = `tab-cam-${uid}`;
  const screenClip = `tab-clip-${uid}`;
  const glassGlare = `tab-glare-${uid}`;

  const kpiCards = [
    {
      label: "Net sales (excl. GST)",
      value: "₹37,905",
      valueSize: 27,
      trend: "+2432.1%",
      positive: true,
      upArrow: true,
      note1: "GST collected ₹1,950 ·",
      note2: "Service charge ₹1,089",
      prev: "vs Sep 2026: ₹1,497",
    },
    {
      label: "Orders",
      value: "63",
      valueSize: 25,
      trend: "+3050.0%",
      positive: true,
      upArrow: true,
      note1: "Settled orders",
      note2: "",
      prev: "vs Sep 2026: 2",
    },
    {
      label: "Avg order value",
      value: "₹602",
      valueSize: 25,
      trend: "-19.6%",
      positive: false,
      upArrow: false,
      note1: "Settled orders, excl. GST",
      note2: "",
      prev: "vs Sep 2026: ₹749",
    },
    {
      label: "Stock wasted",
      value: "₹5,805",
      valueSize: 25,
      trend: "+480.5%",
      positive: false,
      upArrow: false,
      note1: "Value of stock logged as",
      note2: "waste",
      prev: "vs Sep 2026: ₹1,000",
    },
  ];

  const weekBars = [
    { day: "Wed", salesH: 48, staffH: 34 },
    { day: "Thu", salesH: 58, staffH: 44 },
    { day: "Fri", salesH: 74, staffH: 56 },
    { day: "Sat", salesH: 82, staffH: 66 },
    { day: "Sun", salesH: 78, staffH: 62 },
    { day: "Mon", salesH: 44, staffH: 36 },
    { day: "Tue", salesH: 52, staffH: 40 },
  ];

  return (
    <div
      className="hero-tablet-chassis"
      style={{
        filter:
          "drop-shadow(0 36px 64px rgba(15, 23, 42, 0.20)) drop-shadow(0 12px 24px rgba(15, 23, 42, 0.12)) drop-shadow(0 2px 5px rgba(15, 23, 42, 0.08))",
      }}
    >
      <svg
        viewBox="0 0 1240 884"
        role="img"
        aria-label={alt}
        style={{ width: "100%", height: "auto", display: "block", fontFamily: UI_FONT }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        <defs>
          {/* Brushed Space-Black Titanium outer band — distinct metallic rail */}
          <linearGradient id={rimGrad} x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor="#8E96A6" />
            <stop offset="8%" stopColor="#5D6472" />
            <stop offset="45%" stopColor="#414652" />
            <stop offset="82%" stopColor="#2E323B" />
            <stop offset="100%" stopColor="#22252D" />
          </linearGradient>
          {/* Specular top-edge metallic catchlight */}
          <linearGradient id={edgeHighlight} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.68" />
            <stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.24" />
            <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.22" />
          </linearGradient>
          {/* Tactile hardware buttons */}
          <linearGradient id={btnGradH} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#252830" />
            <stop offset="22%" stopColor="#6D7482" />
            <stop offset="50%" stopColor="#8E96A4" />
            <stop offset="78%" stopColor="#595F6C" />
            <stop offset="100%" stopColor="#22252C" />
          </linearGradient>
          <linearGradient id={btnGradV} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#23262E" />
            <stop offset="22%" stopColor="#686F7D" />
            <stop offset="50%" stopColor="#838B99" />
            <stop offset="78%" stopColor="#4E535F" />
            <stop offset="100%" stopColor="#1D2026" />
          </linearGradient>
          {/* Sapphire front camera lens */}
          <radialGradient id={camLens} cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2D5296" />
            <stop offset="48%" stopColor="#111C38" />
            <stop offset="100%" stopColor="#05070D" />
          </radialGradient>
          {/* Subtle glass reflection across the dark bezel/sidebar */}
          <linearGradient id={glassGlare} x1="0" y1="0" x2="0.65" y2="0.85">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.09" />
            <stop offset="24%" stopColor="#FFFFFF" stopOpacity="0.025" />
            <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={screenClip}>
            <rect x="36" y="36" width="1166" height="812" rx="14" />
          </clipPath>
        </defs>

        {/* ── Tactile Titanium Buttons ── */}
        <rect x="1102" y="1.5" width="52" height="3.5" rx="1.75" fill={`url(#${btnGradH})`} />
        <rect x="1233" y="96" width="3.5" height="44" rx="1.75" fill={`url(#${btnGradV})`} />
        <rect x="1233" y="150" width="3.5" height="44" rx="1.75" fill={`url(#${btnGradV})`} />

        {/* ── Grade-5 Titanium Outer Chassis (rx=42) ── */}
        <rect x="4" y="4" width="1230" height="876" rx="42" fill={`url(#${rimGrad})`} stroke="#1E222B" strokeWidth="1" />

        {/* Cellular antenna micro-seams */}
        <g fill="#1F232B" opacity="0.9">
          <rect x="116" y="4.5" width="3.5" height="5" />
          <rect x="1118" y="4.5" width="3.5" height="5" />
          <rect x="116" y="874.5" width="3.5" height="5" />
          <rect x="1118" y="874.5" width="3.5" height="5" />
          <rect x="4.5" y="114" width="5" height="3.5" />
          <rect x="1228.5" y="762" width="5" height="3.5" />
        </g>

        {/* Outer specular titanium bevel */}
        <rect
          x="5.25"
          y="5.25"
          width="1227.5"
          height="873.5"
          rx="40.75"
          fill="none"
          stroke={`url(#${edgeHighlight})`}
          strokeWidth="1.25"
        />

        {/* Diamond-cut recessed gasket seam (rx=37) */}
        <rect x="9.5" y="9.5" width="1219" height="865" rx="37" fill="#040507" />
        <rect
          x="10.25"
          y="10.25"
          width="1217.5"
          height="863.5"
          rx="36.25"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.9"
        />

        {/* ── OLED Piano-Black Glass Bezel (rx=35.5) ── */}
        <rect x="11" y="11" width="1216" height="862" rx="35.5" fill="#07090D" />

        {/* Landscape TrueDepth Camera Array (top long edge) */}
        <g aria-hidden="true">
          <circle cx="619" cy="23.2" r="5.3" fill="#0E121B" stroke="#1C2333" strokeWidth="0.9" />
          <circle cx="619" cy="23.2" r="3.3" fill={`url(#${camLens})`} />
          <circle cx="619" cy="23.2" r="1.4" fill="#030509" />
          <circle cx="617.8" cy="22" r="0.85" fill="#93C5FD" opacity="0.85" />
          <circle cx="639" cy="23.2" r="2.1" fill="#0F131D" />
        </g>

        {/* ── Active Display Screen (1166 x 812, rx=14) ── */}
        <g clipPath={`url(#${screenClip})`}>
          <g transform="translate(36, 36)">
            {/* Main slate canvas */}
            <rect width="1166" height="812" fill="#F8FAFC" />

            {/* ═══ LEFT SIDEBAR (226px) ═══ */}
            <rect x="0" y="58" width="226" height="754" fill="#090D16" />

            {/* Sidebar white brand header */}
            <rect x="0" y="0" width="226" height="58" fill="#FFFFFF" />
            <AlaynLogoVector x={16} y={18.5} height={21} />
            {/* Collapse sidebar icon */}
            <g transform="translate(192, 20)" fill="none" stroke="#94A3B8" strokeWidth="1.35">
              <rect x="0.5" y="0.5" width="17" height="17" rx="3.5" />
              <line x1="6.5" y1="1" x2="6.5" y2="17" />
              <path d="M12.5 6.5 L10 9 L12.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <line x1="225.5" y1="0" x2="225.5" y2="58" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="0" y1="57.5" x2="226" y2="57.5" stroke="#E2E8F0" strokeWidth="1" />

            {/* Active item: Overview */}
            <rect x="10" y="72" width="206" height="36" rx="9" fill="#161D2C" />
            <rect x="10" y="81" width="3" height="18" rx="1.5" fill="#E5484D" />
            <g transform="translate(22, 82)" fill="none" stroke="#E5484D" strokeWidth="1.5">
              <rect x="0.5" y="0.5" width="6" height="6" rx="1.2" />
              <rect x="9" y="0.5" width="6" height="6" rx="1.2" />
              <rect x="0.5" y="9" width="6" height="6" rx="1.2" />
              <rect x="9" y="9" width="6" height="6" rx="1.2" />
            </g>
            <text x="48" y="94.5" fill="#FFFFFF" fontSize="12.5" fontWeight="600">
              Overview
            </text>

            {/* Reports */}
            <SidebarNavRow
              y={118}
              label="Reports"
              icon={
                <>
                  <rect x="2" y="1" width="12" height="14" rx="2" />
                  <path d="M5.5 11 V8.5 M8 11 V6 M10.5 11 V9.5" />
                </>
              }
            />

            {/* SERVICE & FLOOR */}
            <text x="22" y="168" fill="#64748B" fontSize="9.5" fontWeight="700" letterSpacing="0.08em">
              SERVICE &amp; FLOOR
            </text>
            <SidebarNavRow
              y={182}
              label="POS Terminal"
              icon={
                <>
                  <rect x="1" y="2.5" width="14" height="11" rx="2" />
                  <line x1="1" y1="6.5" x2="15" y2="6.5" />
                </>
              }
            />
            <SidebarNavRow
              y={215}
              label="Live Orders"
              icon={
                <>
                  <rect x="2.5" y="1.5" width="11" height="13" rx="2" />
                  <path d="M5.5 5.5 H10.5 M5.5 8.5 H10.5 M5.5 11.5 H8.5" />
                </>
              }
            />
            <SidebarNavRow
              y={248}
              label="Kitchen Dispatch"
              icon={
                <>
                  <path d="M4 13 H12 V9.5 C13.6 9.1 14.5 7.8 14.5 6.2 C14.5 4.3 13 3 11.3 3 C10.7 1.8 9.5 1 8 1 C6.5 1 5.3 1.8 4.7 3 C3 3 1.5 4.3 1.5 6.2 C1.5 7.8 2.4 9.1 4 9.5 Z" />
                </>
              }
            />
            <SidebarNavRow
              y={281}
              label="Table Management"
              icon={
                <>
                  <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
                  <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
                  <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
                  <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
                </>
              }
            />

            {/* BACK-OF-HOUSE */}
            <text x="22" y="328" fill="#64748B" fontSize="9.5" fontWeight="700" letterSpacing="0.08em">
              BACK-OF-HOUSE
            </text>
            <SidebarNavRow
              y={342}
              label="Menu Manager"
              icon={<path d="M3 2 V7 C3 8.5 4.2 9.5 5.5 9.5 V14.5 M5.5 2 V6.5 M8 2 V6.5 M12.5 2 C10.8 4 10.8 7.5 12.5 9.5 V14.5" />}
            />
            <SidebarNavRow
              y={375}
              label="Smart Inventory"
              icon={
                <>
                  <path d="M8 1.5 L14.2 5 V11.5 L8 15 L1.8 11.5 V5 Z" />
                  <path d="M1.8 5 L8 8.5 L14.2 5 M8 8.5 V15" />
                </>
              }
            />
            <SidebarNavRow
              y={408}
              label="Waste Management"
              icon={
                <>
                  <path d="M2.5 4 H13.5 M5.5 4 V2.5 H10.5 V4 M4 4 L4.8 14 H11.2 L12 4" />
                </>
              }
            />

            {/* TEAM & LOCATIONS */}
            <text x="22" y="455" fill="#64748B" fontSize="9.5" fontWeight="700" letterSpacing="0.08em">
              TEAM &amp; LOCATIONS
            </text>
            <SidebarNavRow
              y={469}
              label="Workforce"
              icon={
                <>
                  <circle cx="6.2" cy="5" r="2.6" />
                  <path d="M1.8 13.5 C1.8 10.9 3.8 9.3 6.2 9.3 C8.6 9.3 10.6 10.9 10.6 13.5" />
                  <circle cx="11.5" cy="5.5" r="2" />
                  <path d="M11.8 9.5 C13.4 9.8 14.6 11.1 14.6 13.3" />
                </>
              }
            />
            <SidebarNavRow
              y={502}
              label="Location Manager"
              icon={
                <>
                  <path d="M2 7 L8 2 L14 7 V14 H2 Z" />
                  <rect x="6.2" y="9.2" width="3.6" height="4.8" />
                </>
              }
            />

            {/* SYSTEM */}
            <text x="22" y="549" fill="#64748B" fontSize="9.5" fontWeight="700" letterSpacing="0.08em">
              SYSTEM
            </text>
            <SidebarNavRow
              y={563}
              label="Support & Tickets"
              icon={<path d="M2 3 H14 V11 H6 L2.5 14 V11 H2 Z" />}
            />
            <SidebarNavRow
              y={596}
              label="Settings"
              icon={
                <>
                  <circle cx="8" cy="8" r="2.5" />
                  <path d="M8 1.5 V3.2 M8 12.8 V14.5 M1.5 8 H3.2 M12.8 8 H14.5 M3.4 3.4 L4.6 4.6 M11.4 11.4 L12.6 12.6 M12.6 3.4 L11.4 4.6 M4.6 11.4 L3.4 12.6" />
                </>
              }
            />

            {/* Sidebar Footer Profile Card */}
            <rect x="10" y="746" width="206" height="54" rx="11" fill="#101624" stroke="#1E293B" strokeWidth="1" />
            <rect x="18" y="757" width="32" height="32" rx="8" fill="#D3232A" />
            <text x="34" y="777.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">
              I
            </text>
            <text x="58" y="770" fill="#F8FAFC" fontSize="12" fontWeight="600">
              Iyaan Khan
            </text>
            <text x="58" y="785" fill="#94A3B8" fontSize="10.2" fontWeight="500">
              Owner · Murabba Cafe …
            </text>

            {/* ═══ TOP APP HEADER BAR (x=226..1166, h=58) ═══ */}
            <rect x="226" y="0" width="940" height="58" fill="#FFFFFF" />
            <line x1="226" y1="57.5" x2="1166" y2="57.5" stroke="#E2E8F0" strokeWidth="1" />

            {/* MapPin + Outlet Picker */}
            <g transform="translate(250, 20)" fill="none" stroke="#D3232A" strokeWidth="1.6">
              <path d="M8 17 C8 17 14 11.4 14 6.8 C14 3.5 11.3 1 8 1 C4.7 1 2 3.5 2 6.8 C2 11.4 8 17 8 17 Z" />
              <circle cx="8" cy="6.8" r="2.2" />
            </g>
            <rect x="274" y="13" width="224" height="32" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="287" y="33" fill="#1E293B" fontSize="12" fontWeight="700">
              Murabba Cafe Colaba
            </text>
            <path
              d="M480 27 L484 31 L488 27"
              fill="none"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bell + 22 badge + Profile circle */}
            <rect x="1056" y="11" width="36" height="36" rx="10" fill="#F1F5F9" />
            <g transform="translate(1066, 20)" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 1.5 C5 1.5 3.2 3.6 3.2 6.5 V10 L1.5 12 H14.5 L12.8 10 V6.5 C12.8 3.6 11 1.5 8 1.5 Z" />
              <path d="M6.4 14.2 C6.8 15 7.3 15.4 8 15.4 C8.7 15.4 9.2 15 9.6 14.2" />
            </g>
            <rect x="1079" y="6" width="22" height="16" rx="8" fill="#D3232A" />
            <text x="1090" y="17.2" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700">
              22
            </text>

            <circle cx="1122" cy="29" r="16" fill="#D3232A" />
            <text x="1122" y="33.5" textAnchor="middle" fill="#FFFFFF" fontSize="12.5" fontWeight="700">
              I
            </text>
            <path
              d="M1145 27.5 L1148.5 31 L1152 27.5"
              fill="none"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ═══ MAIN DASHBOARD CANVAS (x=250..1142) ═══ */}

            {/* 1. Overview Header Card */}
            <rect x="250" y="78" width="892" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="270" y="115" fill="#0F172A" fontSize="22" fontWeight="700" letterSpacing="-0.02em">
              Overview
            </text>
            <text x="270" y="137" fill="#64748B" fontSize="11.8" fontWeight="400">
              Murabba Cafe Colaba · Sales, orders, staff and stock at a glance
            </text>

            {/* Date Range Segmented Bar */}
            <rect x="664" y="105" width="458" height="42" rx="11" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
            <text x="694" y="130" textAnchor="middle" fill="#64748B" fontSize="11.2" fontWeight="600">
              Today
            </text>
            <text x="752" y="130" textAnchor="middle" fill="#64748B" fontSize="11.2" fontWeight="600">
              Yesterday
            </text>
            <text x="814" y="130" textAnchor="middle" fill="#64748B" fontSize="11.2" fontWeight="600">
              7 Days
            </text>
            <text x="882" y="130" textAnchor="middle" fill="#64748B" fontSize="11.2" fontWeight="600">
              This Month
            </text>
            <rect x="926" y="109" width="86" height="34" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <text x="969" y="130" textAnchor="middle" fill="#0F172A" fontSize="11.2" fontWeight="700">
              Last Month
            </text>
            {/* Calendar icon + Choose Date */}
            <g transform="translate(1024, 119)" fill="none" stroke="#64748B" strokeWidth="1.3">
              <rect x="0.5" y="1.5" width="12" height="11" rx="2" />
              <line x1="0.5" y1="5" x2="12.5" y2="5" />
              <line x1="4" y1="0" x2="4" y2="3" />
              <line x1="9" y1="0" x2="9" y2="3" />
            </g>
            <text x="1041" y="130" fill="#64748B" fontSize="11.2" fontWeight="600">
              Choose Date
            </text>

            {/* 2. Four Headline KPI Cards */}
            {kpiCards.map((card, i) => {
              const cx = 250 + i * 226.5;
              return (
                <g key={card.label} transform={`translate(${cx}, 190)`}>
                  <rect width="212.5" height="196" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                  <text x="18" y="29" fill="#64748B" fontSize="12" fontWeight="600">
                    {card.label}
                  </text>
                  <CardCornerArrow x={184} y={19} />
                  <text
                    x="18"
                    y="69"
                    fill="#0F172A"
                    fontSize={card.valueSize}
                    fontWeight="700"
                    letterSpacing="-0.02em"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {card.value}
                  </text>
                  <TrendBadge x={18} y={81} label={card.trend} positive={card.positive} upArrow={card.upArrow} />
                  <text x="18" y="123" fill="#64748B" fontSize="11.5" fontWeight="400">
                    {card.note1}
                  </text>
                  {card.note2 && (
                    <text x="18" y="139" fill="#64748B" fontSize="11.5" fontWeight="400">
                      {card.note2}
                    </text>
                  )}
                  <line x1="18" y1="158" x2="194.5" y2="158" stroke="#F1F5F9" strokeWidth="1" />
                  <text
                    x="18"
                    y="177"
                    fill="#64748B"
                    fontSize="11.5"
                    fontWeight="400"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {card.prev}
                  </text>
                </g>
              );
            })}

            {/* 3. Compare in detail link */}
            <text x="1142" y="408" textAnchor="end" fill="#2563EB" fontSize="12" fontWeight="600">
              Compare in detail →
            </text>

            {/* 4. Action Items Card */}
            <g transform="translate(250, 422)">
              <rect width="892" height="164" rx="16" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="1.25" />
              {/* Card Header */}
              <g transform="translate(20, 15)" fill="none" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 1.5 L15 14 H1 Z" />
                <line x1="8" y1="6.2" x2="8" y2="9.4" />
                <circle cx="8" cy="11.8" r="0.5" fill="#D97706" />
              </g>
              <text x="44" y="28" fill="#1E293B" fontSize="13.5" fontWeight="700">
                Action items
              </text>
              <rect x="134" y="14" width="22" height="19" rx="9.5" fill="#FEF3C7" />
              <text x="145" y="27.2" textAnchor="middle" fill="#92400E" fontSize="11" fontWeight="700">
                2
              </text>
              <line x1="0" y1="45" x2="892" y2="45" stroke="#F1F5F9" strokeWidth="1" />

              {/* Row 1 */}
              <circle cx="26" cy="75" r="3.8" fill="#F43F5E" />
              <text x="44" y="70" fill="#1E293B" fontSize="13" fontWeight="600">
                1 person not clocked in
              </text>
              <text x="44" y="87" fill="#64748B" fontSize="11.5" fontWeight="400">
                Abdullah (shift started 3 PM)
              </text>
              <path
                d="M866 70 L871 75 L866 80"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="0" y1="104" x2="892" y2="104" stroke="#F1F5F9" strokeWidth="1" />

              {/* Row 2 */}
              <circle cx="26" cy="134" r="3.8" fill="#F59E0B" />
              <text x="44" y="129" fill="#1E293B" fontSize="13" fontWeight="600">
                3 items running low
              </text>
              <text x="44" y="146" fill="#64748B" fontSize="11.5" fontWeight="400">
                Buff (0 kg left), Chicken (0 kg left), Meat &amp; Mutton (1 kg left)
              </text>
              <path
                d="M866 129 L871 134 L866 139"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* 5. Bottom Operational Cards (Shift coverage + 7-day forecast) */}
            {/* Left: Shift coverage today */}
            <g transform="translate(250, 604)">
              <rect width="368" height="192" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="20" y="18" width="36" height="36" rx="10" fill="#EEF2FF" />
              <g transform="translate(30, 28)" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 13 H12 V9.5 C13.6 9.1 14.5 7.8 14.5 6.2 C14.5 4.3 13 3 11.3 3 C10.7 1.8 9.5 1 8 1 C6.5 1 5.3 1.8 4.7 3 C3 3 1.5 4.3 1.5 6.2 C1.5 7.8 2.4 9.1 4 9.5 Z" />
              </g>
              <text x="68" y="33" fill="#1E293B" fontSize="14" fontWeight="700">
                Shift coverage today
              </text>
              <text x="68" y="50" fill="#64748B" fontSize="11.5" fontWeight="400">
                0 of 2 working today are in
              </text>

              {/* Staff member 1 */}
              <circle cx="36" cy="94" r="15" fill="#334155" />
              <text x="36" y="98.2" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700">
                AB
              </text>
              <text x="60" y="90" fill="#1E293B" fontSize="13" fontWeight="600">
                Abdullah
              </text>
              <text x="60" y="106" fill="#64748B" fontSize="11" fontWeight="400">
                Shift 15:00 – 21:00 · Floor
              </text>
              <rect x="262" y="82" width="88" height="24" rx="12" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1" />
              <text x="306" y="98" textAnchor="middle" fill="#BE123C" fontSize="11" fontWeight="600">
                Not clocked in
              </text>

              <line x1="20" y1="124" x2="348" y2="124" stroke="#F1F5F9" strokeWidth="1" />

              {/* Staff member 2 */}
              <circle cx="36" cy="154" r="15" fill="#475569" />
              <text x="36" y="158.2" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700">
                RK
              </text>
              <text x="60" y="150" fill="#1E293B" fontSize="13" fontWeight="600">
                Rohan Kumar
              </text>
              <text x="60" y="166" fill="#64748B" fontSize="11" fontWeight="400">
                Shift 18:00 – 23:30 · Kitchen
              </text>
              <rect x="272" y="142" width="78" height="24" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <text x="311" y="158" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                Starts 6 PM
              </text>
            </g>

            {/* Right: Next 7 days: staff vs demand */}
            <g transform="translate(634, 604)">
              <rect width="508" height="192" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="20" y="18" width="36" height="36" rx="10" fill="#EEF2FF" />
              <g transform="translate(30, 28)" fill="none" stroke="#4F46E5" strokeWidth="1.5">
                <rect x="1" y="2" width="14" height="13" rx="2.2" />
                <line x1="1" y1="6" x2="15" y2="6" />
                <line x1="5" y1="0.5" x2="5" y2="3.5" />
                <line x1="11" y1="0.5" x2="11" y2="3.5" />
              </g>
              <text x="68" y="33" fill="#1E293B" fontSize="14" fontWeight="700">
                Next 7 days: staff vs demand
              </text>
              <text x="68" y="50" fill="#64748B" fontSize="11.5" fontWeight="400">
                Forecast sales next to the people rostered each day
              </text>

              {/* 7-day bar chart */}
              {weekBars.map((b, idx) => {
                const bx = 22 + idx * 67;
                return (
                  <g key={b.day} transform={`translate(${bx}, 68)`}>
                    <rect width="54" height="92" rx="10" fill="#F8FAFC" stroke="#F1F5F9" strokeWidth="1" />
                    <rect
                      x="13"
                      y={92 - b.salesH}
                      width="13"
                      height={b.salesH}
                      rx="4"
                      fill="#E11D48"
                    />
                    <rect
                      x="29"
                      y={92 - b.staffH}
                      width="13"
                      height={b.staffH}
                      rx="4"
                      fill="#4F46E5"
                    />
                    <text x="27" y="110" textAnchor="middle" fill="#64748B" fontSize="10.5" fontWeight="600">
                      {b.day}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Subtle optical glass reflection on left dark area */}
            <rect width="1166" height="812" fill={`url(#${glassGlare})`} pointerEvents="none" />
          </g>
        </g>

        {/* Crisp inner screen glass hairline */}
        <rect
          x="35.5"
          y="35.5"
          width="1167"
          height="813"
          rx="14.5"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

/**
 * Black Titanium iPhone 16 Pro in portrait around the mobile Alayn Overview screen.
 */
export function Phone({ alt = "Alayn dashboard on a phone" }: { src?: string; alt?: string }) {
  const uid = useId().replace(/:/g, "");
  const rimGrad = `ph-rim-${uid}`;
  const edgeHighlight = `ph-hi-${uid}`;
  const btnGrad = `ph-btn-${uid}`;
  const camLens = `ph-cam-${uid}`;
  const screenClip = `ph-clip-${uid}`;

  const mobileKpis = [
    {
      x: 14,
      y: 324,
      label: "Net sales (excl. GST)",
      value: "₹37,905",
      trend: "+2432.1%",
      positive: true,
      upArrow: true,
      note1: "GST collected ₹1,950 ·",
      note2: "Service charge ₹1,089",
      prev: "vs Sep 2026: ₹1,497",
    },
    {
      x: 202,
      y: 324,
      label: "Orders",
      value: "63",
      trend: "+3050.0%",
      positive: true,
      upArrow: true,
      note1: "Settled orders",
      note2: "",
      prev: "vs Sep 2026: 2",
    },
    {
      x: 14,
      y: 516,
      label: "Avg order value",
      value: "₹602",
      trend: "-19.6%",
      positive: false,
      upArrow: false,
      note1: "Settled orders, excl. GST",
      note2: "",
      prev: "vs Sep 2026: ₹749",
    },
    {
      x: 202,
      y: 516,
      label: "Stock wasted",
      value: "₹5,805",
      trend: "+480.5%",
      positive: false,
      upArrow: false,
      note1: "Value of stock logged as",
      note2: "waste",
      prev: "vs Sep 2026: ₹1,000",
    },
  ];

  return (
    <div
      className="hero-phone-chassis"
      style={{
        filter:
          "drop-shadow(16px 22px 36px rgba(9, 13, 22, 0.32)) drop-shadow(0 16px 28px rgba(15, 23, 42, 0.20)) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.12))",
      }}
    >
      <svg
        viewBox="0 0 436 896"
        role="img"
        aria-label={alt}
        style={{ width: "100%", height: "auto", display: "block", fontFamily: UI_FONT }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id={rimGrad} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#949CAC" />
            <stop offset="8%" stopColor="#606775" />
            <stop offset="45%" stopColor="#424754" />
            <stop offset="82%" stopColor="#2D313B" />
            <stop offset="100%" stopColor="#20232B" />
          </linearGradient>
          <linearGradient id={edgeHighlight} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.70" />
            <stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.24" />
            <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={btnGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22252C" />
            <stop offset="24%" stopColor="#6D7482" />
            <stop offset="50%" stopColor="#8A92A0" />
            <stop offset="76%" stopColor="#4D525E" />
            <stop offset="100%" stopColor="#1C1F25" />
          </linearGradient>
          <radialGradient id={camLens} cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2D5296" />
            <stop offset="50%" stopColor="#101A34" />
            <stop offset="100%" stopColor="#04060A" />
          </radialGradient>
          <clipPath id={screenClip}>
            <rect x="21" y="21" width="394" height="854" rx="51" />
          </clipPath>
        </defs>

        {/* ── Tactile Side Buttons (Action + Volume on left, Power on right) ── */}
        <rect x="1" y="156" width="3.5" height="30" rx="1.75" fill={`url(#${btnGrad})`} />
        <rect x="1" y="208" width="3.5" height="56" rx="1.75" fill={`url(#${btnGrad})`} />
        <rect x="1" y="276" width="3.5" height="56" rx="1.75" fill={`url(#${btnGrad})`} />
        <rect x="431.5" y="226" width="3.5" height="84" rx="1.75" fill={`url(#${btnGrad})`} />

        {/* ── Grade-5 Black Titanium Outer Frame (rx=68, concentric) ── */}
        <rect x="4" y="4" width="428" height="888" rx="68" fill={`url(#${rimGrad})`} stroke="#1D212A" strokeWidth="1" />

        {/* Titanium antenna bands */}
        <g fill="#1E222B" opacity="0.9">
          <rect x="4.5" y="88" width="5" height="3.5" />
          <rect x="426.5" y="88" width="5" height="3.5" />
          <rect x="4.5" y="804" width="5" height="3.5" />
          <rect x="426.5" y="804" width="5" height="3.5" />
        </g>

        {/* Specular outer rim chamfer */}
        <rect
          x="5.25"
          y="5.25"
          width="425.5"
          height="885.5"
          rx="66.75"
          fill="none"
          stroke={`url(#${edgeHighlight})`}
          strokeWidth="1.25"
        />

        {/* Diamond-cut recessed gasket (rx=63) */}
        <rect x="9" y="9" width="418" height="878" rx="63" fill="#040507" />
        <rect
          x="9.75"
          y="9.75"
          width="416.5"
          height="876.5"
          rx="62.25"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.9"
        />

        {/* ── Ultra-Thin Symmetrical OLED Glass Bezel (rx=61.5) ── */}
        <rect x="10.5" y="10.5" width="415" height="875" rx="61.5" fill="#06080B" />

        {/* Top earpiece speaker micro-slit */}
        <rect x="190" y="14" width="56" height="2.4" rx="1.2" fill="#151922" />

        {/* ── Active OLED Screen (394 x 854, rx=51: 62 - 11 = 51 concentric!) ── */}
        <g clipPath={`url(#${screenClip})`}>
          <g transform="translate(21, 21)">
            <rect width="394" height="854" fill="#F8FAFC" />

            {/* iOS Status Bar */}
            <rect width="394" height="50" fill="#FFFFFF" />
            <text
              x="38"
              y="32"
              fill="#0F172A"
              fontSize="15"
              fontWeight="600"
              letterSpacing="-0.02em"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              9:41
            </text>

            {/* Dynamic Island */}
            <rect x="135" y="10" width="124" height="35" rx="17.5" fill="#000000" />
            <circle cx="216" cy="27.5" r="4.5" fill="#0B0E15" />
            <circle cx="240" cy="27.5" r="5.6" fill="#0E1320" stroke="#1B2438" strokeWidth="0.7" />
            <circle cx="240" cy="27.5" r="3.4" fill={`url(#${camLens})`} />
            <circle cx="238.9" cy="26.4" r="0.9" fill="#93C5FD" opacity="0.85" />

            {/* Status icons: Cellular, Wi-Fi, Battery */}
            <g transform="translate(296, 20)" fill="#0F172A">
              <rect x="0" y="7.5" width="3" height="4.5" rx="0.9" />
              <rect x="4.6" y="5.2" width="3" height="6.8" rx="0.9" />
              <rect x="9.2" y="2.6" width="3" height="9.4" rx="0.9" />
              <rect x="13.8" y="0" width="3" height="12" rx="0.9" />
              <g transform="translate(22, 0.5)">
                <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.4 8.4 0 0 1 6-2.4Z" />
                <path d="M8 5.6c1.4 0 2.7.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 3.8c-1.9 0-3.6.7-4.8 1.9L4.4 7A5.2 5.2 0 0 1 8 5.6Z" />
                <path d="M8 9.1c.5 0 .9.2 1.3.5L8 11 6.7 9.6c.4-.3.8-.5 1.3-.5Z" />
              </g>
              <g transform="translate(43, 0.5)" fill="none">
                <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="#0F172A" strokeOpacity="0.38" />
                <rect x="2" y="2" width="15.5" height="8" rx="1.8" fill="#0F172A" />
                <path d="M23 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="#0F172A" fillOpacity="0.42" />
              </g>
            </g>

            {/* Mobile App Top Bar */}
            <rect y="50" width="394" height="54" fill="#FFFFFF" />
            <line x1="0" y1="103.5" x2="394" y2="103.5" stroke="#E2E8F0" strokeWidth="1" />
            <g transform="translate(18, 69)" stroke="#334155" strokeWidth="1.8" strokeLinecap="round">
              <line x1="0" y1="2" x2="18" y2="2" />
              <line x1="0" y1="8" x2="18" y2="8" />
              <line x1="0" y1="14" x2="18" y2="14" />
            </g>
            <line x1="50" y1="66" x2="50" y2="88" stroke="#E2E8F0" strokeWidth="1" />
            {/* Crisp Registered Trademark Logo */}
            <AlaynLogoVector x={64} y={67.5} height={19} />

            {/* Bell + 22 badge + Profile */}
            <rect x="298" y="59" width="36" height="36" rx="10" fill="#F1F5F9" />
            <g transform="translate(308, 68)" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 1.5 C5 1.5 3.2 3.6 3.2 6.5 V10 L1.5 12 H14.5 L12.8 10 V6.5 C12.8 3.6 11 1.5 8 1.5 Z" />
              <path d="M6.4 14.2 C6.8 15 7.3 15.4 8 15.4 C8.7 15.4 9.2 15 9.6 14.2" />
            </g>
            <rect x="321" y="54" width="22" height="16" rx="8" fill="#D3232A" />
            <text x="332" y="65.2" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700">
              22
            </text>
            <circle cx="362" cy="77" r="15" fill="#D3232A" />
            <text x="362" y="81.5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700">
              I
            </text>

            {/* 1. Mobile Overview Card */}
            <rect x="14" y="116" width="366" height="196" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="30" y="150" fill="#0F172A" fontSize="21" fontWeight="700" letterSpacing="-0.02em">
              Overview
            </text>
            <text x="30" y="171" fill="#64748B" fontSize="12.2" fontWeight="400">
              Murabba Cafe Colaba · Sales, orders, staff
            </text>
            <text x="30" y="188" fill="#64748B" fontSize="12.2" fontWeight="400">
              and stock at a glance
            </text>

            {/* Mobile Date Selector Box */}
            <rect x="30" y="202" width="334" height="94" rx="12" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
            <text x="46" y="225" fill="#64748B" fontSize="11.5" fontWeight="600">
              Today
            </text>
            <text x="108" y="225" fill="#64748B" fontSize="11.5" fontWeight="600">
              Yesterday
            </text>
            <text x="192" y="225" fill="#64748B" fontSize="11.5" fontWeight="600">
              7 Days
            </text>

            <text x="46" y="255" fill="#64748B" fontSize="11.5" fontWeight="600">
              This Month
            </text>
            <rect x="128" y="236" width="90" height="28" rx="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <text x="173" y="254.5" textAnchor="middle" fill="#0F172A" fontSize="11.5" fontWeight="700">
              Last Month
            </text>

            <g transform="translate(46, 273)" fill="none" stroke="#64748B" strokeWidth="1.3">
              <rect x="0.5" y="1.5" width="12" height="11" rx="2" />
              <line x1="0.5" y1="5" x2="12.5" y2="5" />
              <line x1="4" y1="0" x2="4" y2="3" />
              <line x1="9" y1="0" x2="9" y2="3" />
            </g>
            <text x="64" y="284" fill="#64748B" fontSize="11.5" fontWeight="600">
              Choose Date
            </text>

            {/* 2. Mobile 2x2 KPI Grid */}
            {mobileKpis.map((card) => (
              <g key={card.label} transform={`translate(${card.x}, ${card.y})`}>
                <rect width="178" height="182" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <text x="14" y="26" fill="#64748B" fontSize="11.5" fontWeight="600">
                  {card.label}
                </text>
                <CardCornerArrow x={154} y={17} />
                <text
                  x="14"
                  y="62"
                  fill="#0F172A"
                  fontSize="22"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {card.value}
                </text>
                <TrendBadge x={14} y={73} label={card.trend} positive={card.positive} upArrow={card.upArrow} />
                <text x="14" y="114" fill="#64748B" fontSize="11" fontWeight="400">
                  {card.note1}
                </text>
                {card.note2 && (
                  <text x="14" y="129" fill="#64748B" fontSize="11" fontWeight="400">
                    {card.note2}
                  </text>
                )}
                <line x1="14" y1="147" x2="164" y2="147" stroke="#F1F5F9" strokeWidth="1" />
                <text
                  x="14"
                  y="165"
                  fill="#64748B"
                  fontSize="11"
                  fontWeight="400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {card.prev}
                </text>
              </g>
            ))}

            {/* 3. Compare in detail */}
            <text x="380" y="722" textAnchor="end" fill="#2563EB" fontSize="11.5" fontWeight="600">
              Compare in detail →
            </text>

            {/* 4. Action items card — flows naturally past the bottom fold like a live scroll view */}
            <g transform="translate(14, 736)">
              <rect width="366" height="140" rx="16" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="1.25" />
              <g transform="translate(16, 12)" fill="none" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 1.5 L14 13 H1 Z" />
                <line x1="7.5" y1="5.8" x2="7.5" y2="8.8" />
                <circle cx="7.5" cy="11" r="0.5" fill="#D97706" />
              </g>
              <text x="38" y="24" fill="#1E293B" fontSize="13" fontWeight="700">
                Action items
              </text>
              <rect x="124" y="11" width="21" height="18" rx="9" fill="#FEF3C7" />
              <text x="134.5" y="23.5" textAnchor="middle" fill="#92400E" fontSize="10.5" fontWeight="700">
                2
              </text>
              <line x1="0" y1="38" x2="366" y2="38" stroke="#F1F5F9" strokeWidth="1" />

              <circle cx="22" cy="66" r="3.5" fill="#F43F5E" />
              <text x="36" y="61" fill="#1E293B" fontSize="12.2" fontWeight="600">
                1 person not clocked in
              </text>
              <text x="36" y="77" fill="#64748B" fontSize="11" fontWeight="400">
                Abdullah (shift started 3 PM)
              </text>
              <line x1="0" y1="94" x2="366" y2="94" stroke="#F1F5F9" strokeWidth="1" />
            </g>

            {/* iOS bottom safe-area fade + Home Indicator */}
            <rect y="830" width="394" height="24" fill="#FFFFFF" opacity="0.92" />
            <rect x="127" y="840" width="140" height="5" rx="2.5" fill="#0F172A" opacity="0.85" />
          </g>
        </g>

        {/* Crisp inner OLED glass edge seal */}
        <rect
          x="20.5"
          y="20.5"
          width="395"
          height="855"
          rx="51.5"
          fill="none"
          stroke="rgba(255,255,255,0.11)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
