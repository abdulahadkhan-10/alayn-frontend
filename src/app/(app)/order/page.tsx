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
        <div className="min-h-screen bg-[#070C16] text-white flex items-center justify-center p-6">
          <p className="text-zinc-400 text-sm animate-pulse">Loading menu...</p>
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
