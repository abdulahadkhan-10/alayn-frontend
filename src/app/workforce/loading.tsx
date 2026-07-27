"use client";

import React from "react";
import FullDashboardSkeleton from "@/components/dashboard/FullDashboardSkeleton";
import WorkforceSkeleton from "@/components/Workforce/WorkforceSkeleton";

export default function WorkforceLoading() {
  return (
    <FullDashboardSkeleton>
      <WorkforceSkeleton />
    </FullDashboardSkeleton>
  );
}
