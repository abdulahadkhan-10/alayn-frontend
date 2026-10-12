"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import TableManagementComponent from "@/components/tables/TableManagementComponent";

export default function TablesPage() {
  return (
    <AuthGuard>
      <TableManagementComponent />
    </AuthGuard>
  );
}
