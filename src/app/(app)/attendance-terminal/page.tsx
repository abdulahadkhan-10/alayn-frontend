"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AttendanceTerminalPage from "@/components/Workforce/AttendanceTerminalPage";

export default function AttendanceTerminalRoute() {
  return (
    <AuthGuard>
      <AttendanceTerminalPage />
    </AuthGuard>
  );
}
