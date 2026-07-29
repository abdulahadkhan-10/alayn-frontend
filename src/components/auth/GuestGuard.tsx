"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetMeQuery } from "@/redux/slices/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { setCredentials } from "@/redux/slices/authSlice";

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const hasUser = !!user || isAuthenticated;

  // Execute getMe in background to check if cookie session is active
  const { data: meData } = useGetMeQuery(undefined);

  useEffect(() => {
    if (meData) {
      const userData = (meData as any)?.data || meData;
      if (userData?.user || userData?.id) {
        dispatch(setCredentials(userData));
        const role = userData?.user?.role || userData?.role;
        if (role === "STAFF") router.replace("/pos");
        else if (role === "KITCHEN") router.replace("/kitchen");
        else if (role === "SUPPLIER") router.replace("/supplier");
        else router.replace("/dashboard");
      }
    }
  }, [meData, dispatch, router]);

  useEffect(() => {
    if (hasUser) {
      if (user?.role === "STAFF") router.replace("/pos");
      else if (user?.role === "KITCHEN") router.replace("/kitchen");
      else if (user?.role === "SUPPLIER") router.replace("/supplier");
      else router.replace("/dashboard");
    }
  }, [hasUser, user?.role, router]);

  // If user is already authenticated, return null while redirecting to /dashboard
  if (hasUser) {
    return null;
  }

  // Render auth page children (login / signup) instantly without any dashboard skeleton flash
  return <>{children}</>;
}
