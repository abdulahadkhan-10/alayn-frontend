"use client";

import { use } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import InventoryPage from "@/components/Inventory/InventoryPage";

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default function InventoryRoute(props?: PageProps) {
  if (props?.params) use(props.params);
  if (props?.searchParams) use(props.searchParams);
  return (
    <AuthGuard>
      <InventoryPage />
    </AuthGuard>
  );
}
