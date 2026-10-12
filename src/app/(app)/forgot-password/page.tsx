import type { Metadata } from "next";
import ForgotPasswordComponent from "@/components/auth/ForgotPasswordComponent";
import GuestGuard from "@/components/auth/GuestGuard";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Alayn account password securely via email verification code.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordComponent />
    </GuestGuard>
  );
}
