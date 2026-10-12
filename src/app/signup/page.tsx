import type { Metadata } from "next";
import SignUp from "@/components/SignUp";
import GuestGuard from "@/components/auth/GuestGuard";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Alayn AI account.",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
    return (
        <GuestGuard>
            <SignUp />
        </GuestGuard>
    );
}
