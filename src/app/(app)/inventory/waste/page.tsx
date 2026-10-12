"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyInventoryWastePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/waste");
  }, [router]);

  return null;
}
