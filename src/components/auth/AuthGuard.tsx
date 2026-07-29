"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetMeQuery } from "@/redux/slices/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { logout, setCredentials } from "@/redux/slices/authSlice";
import FullDashboardSkeleton from "@/components/dashboard/FullDashboardSkeleton";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const hasUser = !!user || isAuthenticated;

  // Enforce a minimum 2-second loader time on initial load / refresh
  const [isMinLoading, setIsMinLoading] = useState(true);

  // Execute getMe query in background to validate HTTP-Only cookie session
  const { data: meData, isLoading, isError } = useGetMeQuery(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinLoading(false);
    }, 800); // 800ms snappy display time

    return () => clearTimeout(timer);
  }, []);

  // Sync user state on getMe success
  useEffect(() => {
    if (meData) {
      const userData = (meData as any)?.data || meData;
      if (userData?.user || userData?.id) {
        dispatch(setCredentials(userData));
      }
    }
  }, [meData, dispatch]);

  // Handle unauthorized session -> logout Redux state and redirect to /login after 2-second loader
  useEffect(() => {
    if (!isMinLoading && (isError || (!isLoading && !hasUser))) {
      console.warn("AuthGuard: Unauthenticated session. Redirecting to /login...");
      dispatch(logout());
      router.replace("/login");
    }
  }, [isError, isLoading, hasUser, isMinLoading, dispatch, router]);

  // Show FullDashboardSkeleton for at least 2 seconds or while querying session
  if (isMinLoading || isLoading) {
    return <FullDashboardSkeleton />;
  }

  // If session validation failed or unauthenticated after min loading time, show FullDashboardSkeleton while redirecting
  if (isError || !hasUser) {
    return <FullDashboardSkeleton />;
  }

  // Render protected children only once authenticated and 2-second min loader time has elapsed
  return <>{children}</>;
}
