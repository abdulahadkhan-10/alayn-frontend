import type { Metadata } from "next";
import LoginComponent from "@/components/LoginComponent";
import GuestGuard from "@/components/auth/GuestGuard";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Alayn AI account.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginComponent />
    </GuestGuard>
  );
}
