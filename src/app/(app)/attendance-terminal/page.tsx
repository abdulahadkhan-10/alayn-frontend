"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AttendanceTerminalPage from "@/components/Workforce/AttendanceTerminalPage";
import { ProLockedPanel } from "@/components/subscription/ProUpgrade";
import { useBranch } from "@/lib/BranchContext";
import { useIsPro } from "@/lib/plan";

function AttendanceTerminal() {
  const { loading } = useBranch();
  const isPro = useIsPro();
  if (!loading && !isPro) {
    return (
      <div className="min-h-screen bg-[#F4F7F9] p-4">
        <ProLockedPanel
          title="Clock-in terminal"
          description="Let staff clock in and out on a shared device, with geofencing and late marks, on Alayn Pro."
        />
      </div>
    );
  }
  return <AttendanceTerminalPage />;
}

export default function AttendanceTerminalRoute() {
  return (
    <AuthGuard>
      <AttendanceTerminal />
    </AuthGuard>
  );
}
