"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MenuManagementComponent from "@/components/menu/MenuManagementComponent";

export default function MenuPage() {
  return (
    <AuthGuard>
      <MenuManagementComponent />
    </AuthGuard>
  );
}
