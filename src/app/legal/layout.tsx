import React from "react";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Terms of Service", href: "/legal/terms" },
    { name: "Refund Policy", href: "/legal/refund" },
    { name: "Cookie Policy", href: "/legal/cookie" },
    { name: "Security & Data", href: "/legal/security" },
    { name: "Responsible AI", href: "/legal/responsible-ai" },
    { name: "Corporate Info", href: "/legal/corporate" },
    { name: "Support & Grievance", href: "/legal/support" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <LandingNav />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-32 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-32">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Legal Hub
            </h3>
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="mt-8 pt-8 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Contact Legal
              </h3>
              <a href="mailto:brahmglobalholdings@gmail.com" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                brahmglobalholdings@gmail.com
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl">
          {children}
        </main>
      </div>
      <LandingFooter />
    </div>
  );
}
