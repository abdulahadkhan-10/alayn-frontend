"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SupplierRedirectPage() {
  useEffect(() => {
    const targetUrl = process.env.NEXT_PUBLIC_SUPPLIER_PORTAL_URL
      ? `${process.env.NEXT_PUBLIC_SUPPLIER_PORTAL_URL}/orders`
      : "https://suppliers.alaynai.com/orders";
    window.location.href = targetUrl;
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C41E2A]" />
        <p className="mt-3 text-sm font-semibold text-gray-700">
          Redirecting to the Supplier Portal...
        </p>
        <p className="mt-1 text-xs text-gray-400">suppliers.alaynai.com</p>
      </div>
    </div>
  );
}
