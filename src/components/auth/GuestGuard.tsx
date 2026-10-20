"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { verifySession } from "@/redux/slices/authSlice";
import { readNextFromLocation, roleHome } from "@/lib/authRedirect";
import AuthLoader from "@/components/auth/AuthLoader";

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps the sign-in, sign-up and password-reset pages: they are for people who are NOT signed in.
 *
 * The form shows straight away (a visitor should never wait on a network call to type their
 * email). In the background the server is asked whether a session already exists; if it does, the
 * person is sent on to where they were headed (?next=) or their role's home page.
 */
export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const status = useAppSelector((s) => s.auth.status);
  const role = useAppSelector((s) => s.auth.user?.role);

  // Find out whether a session already exists
  useEffect(() => {
    if (status === "unknown") void dispatch(verifySession());
  }, [status, dispatch]);

  // Already signed in (found just now, or signed in here, or in another tab): move on
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(readNextFromLocation() ?? roleHome(role));
    }
  }, [status, role, router]);

  if (status === "authenticated") {
    return <AuthLoader label="Taking you to your account" />;
  }

  return <>{children}</>;
}
