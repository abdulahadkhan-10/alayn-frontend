"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import KitchenDispatchBoardComponent from "@/components/kitchen/KitchenDispatchBoardComponent";

export default function KitchenPage() {
  return (
    <AuthGuard>
      <KitchenDispatchBoardComponent />
    </AuthGuard>
  );
}
