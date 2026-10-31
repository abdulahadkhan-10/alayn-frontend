"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CustomerOrderUI from "@/components/customer/CustomerOrderUI";

function OrderContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  return <CustomerOrderUI token={token} />;
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-6 text-[var(--espresso)]">
          <p className="animate-pulse text-sm text-[var(--muted)]">Loading menu...</p>
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
