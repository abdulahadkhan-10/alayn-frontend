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

  // Execute getMe query in background to validate session
  const { data: meData, isLoading, isError } = useGetMeQuery(undefined);

  // Sync user state on getMe success
  useEffect(() => {
    if (meData) {
      const userData = (meData as any)?.data || meData;
      if (userData?.user || userData?.id) {
        dispatch(setCredentials(userData));
      }
    }
  }, [meData, dispatch]);

  // Handle unauthorized session -> logout Redux state and redirect to /login
  useEffect(() => {
    if (isError || (!isLoading && !hasUser)) {
      console.warn("AuthGuard: Unauthenticated session. Redirecting to /login...");
      dispatch(logout());
      router.replace("/login");
    }
  }, [isError, isLoading, hasUser, dispatch, router]);

  // If we already have a cached user in Redux store / localStorage, render immediately without blocking on network query
  if (hasUser) {
    return <>{children}</>;
  }

  // Show FullDashboardSkeleton only on cold boot when no cached user exists and session is being verified
  if (isLoading) {
    return <FullDashboardSkeleton />;
  }

  // If session validation failed or unauthenticated, show FullDashboardSkeleton while redirecting
  if (isError || !hasUser) {
    return <FullDashboardSkeleton />;
  }

  return <>{children}</>;
}
