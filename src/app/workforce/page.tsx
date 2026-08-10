"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import WorkforcePage from "@/components/Workforce/WorkforcePage";
import ShiftSchedulerPage from "@/components/Workforce/ShiftSchedulerPage";
import { useAppSelector } from "@/redux/store/hooks";

export default function WorkforceRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  return (
    <AuthGuard>
      {isManagerOrOwner ? <WorkforcePage /> : <ShiftSchedulerPage />}
    </AuthGuard>
  );
}
