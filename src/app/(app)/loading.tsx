"use client";

import React from "react";
import { usePathname } from "next/navigation";
import FullDashboardSkeleton from "@/components/dashboard/FullDashboardSkeleton";
import { BrandSplash } from "@/components/auth/AuthLoader";
import { useAppSelector } from "@/redux/store/hooks";

// Lives in (app) rather than the root: at the root it wrapped the marketing
// pages too, so their HTML opened with this splash and carried the real
// content in a hidden block that agents and text extractors skip.
export default function Loading() {
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);

  // Public pages (landing, login, signup) use the minimalist white background logo loader.
  const isPublicPage = !pathname || pathname === "/" || pathname === "/login" || pathname === "/signup";

  // Protected routes: until the server has confirmed the session (every page load / refresh) show
  // the same brand loader AuthGuard shows, so there is no skeleton -> loader flicker. Once signed
  // in, moving between pages keeps the dashboard skeleton, which matches what is about to appear.
  if (isPublicPage || status !== "authenticated") {
    return <BrandSplash label="Loading" />;
  }

  return <FullDashboardSkeleton />;
}
