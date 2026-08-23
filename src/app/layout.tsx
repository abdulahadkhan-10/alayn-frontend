import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/store/provider";
import { BranchProvider } from "@/lib/BranchContext";
import GlobalToastContainer from "@/components/toast/GlobalToastContainer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alaynai.com"),
  title: {
    default: "Alayn — The AI Operating System for Modern Businesses",
    template: "%s | Alayn AI",
  },
  description: "Alayn connects staff, inventory, orders, waste, analytics and feedback into one AI-powered platform built specifically for café and restaurant owners in India.",
  keywords: ["Alayn", "Alayn AI", "Restaurant Operating System", "Cafe POS India", "AI Inventory Management", "Restaurant Management Software"],
  openGraph: {
    title: "Alayn — The AI Operating System for Modern Businesses",
    description: "Alayn connects staff, inventory, orders, waste, analytics and feedback into one AI-powered platform built specifically for café and restaurant owners in India.",
    url: "https://alaynai.com",
    siteName: "Alayn AI",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/alaynlogo.png",
        width: 1200,
        height: 630,
        alt: "Alayn AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alayn — The AI Operating System for Modern Businesses",
    description: "Alayn connects staff, inventory, orders, waste, analytics and feedback into one AI-powered platform.",
    images: ["/alaynlogo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4F7F9] text-gray-900 font-sans">
        <ReduxProvider>
          <BranchProvider>
            {children}
            <GlobalToastContainer />
          </BranchProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
