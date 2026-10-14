import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/v1\/?$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}


const ROLE_LABELS: Record<string, string> = {
  BUSINESS_OWNER: "Owner",
  SUPER_ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  KITCHEN: "Kitchen",
  SUPPLIER: "Supplier",
};

// Turns a role code like "BUSINESS_OWNER" into a label people can read ("Owner")
export function formatRole(role: string | undefined | null): string {
  if (!role) return "Owner";
  return ROLE_LABELS[role] ?? role.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
