import SupportPage from "@/components/support/SupportPage";

export const metadata = {
  title: "Support & Queries Hub",
  description: "Branch-wise management of staff queries, internal concerns, and customer feedback tickets.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SupportPage />;
}
