"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import PosTerminalComponent from "@/components/pos/PosTerminalComponent";

export default function PosPage() {
  return (
    <AuthGuard>
      <PosTerminalComponent />
    </AuthGuard>
  );
}
