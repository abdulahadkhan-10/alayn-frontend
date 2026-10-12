import type React from "react";
import type { Metadata } from "next";

// The table QR menu is a per-token, view-only page for diners at the table.
// page.tsx is a client component and can't export metadata, so it lives here.
export const metadata: Metadata = {
  title: "Menu",
  robots: { index: false, follow: false },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
