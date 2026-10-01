"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetMeQuery } from "@/redux/slices/authApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { logout, setCredentials } from "@/redux/slices/authSlice";

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasUser = (!!user || isAuthenticated) && !isSuperAdmin;

  // Execute getMe in background to check if cookie session is active
  const { data: meData } = useGetMeQuery(undefined);

  useEffect(() => {
    if (meData) {
      const userData = (meData as any)?.data || meData;
      const parsedUser = userData?.user || userData;
      const role = parsedUser?.role;

      if (role === "SUPER_ADMIN") {
        dispatch(logout());
        return;
      }

      if (userData?.user || userData?.id) {
        dispatch(setCredentials(userData));
        if (role === "STAFF") router.replace("/pos");
        else if (role === "KITCHEN") router.replace("/kitchen");
        else if (role === "SUPPLIER") router.replace("/supplier");
        else router.replace("/dashboard");
      }
    }
  }, [meData, dispatch, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(logout());
      return;
    }

    if (hasUser) {
      if (user?.role === "STAFF") router.replace("/pos");
      else if (user?.role === "KITCHEN") router.replace("/kitchen");
      else if (user?.role === "SUPPLIER") router.replace("/supplier");
      else router.replace("/dashboard");
    }
  }, [hasUser, isSuperAdmin, user?.role, dispatch, router]);

  // If user is already authenticated, return null while redirecting to /dashboard
  if (hasUser) {
    return null;
  }

  // Render auth page children (login / signup) instantly without any dashboard skeleton flash
  return <>{children}</>;
}
