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

const siteUrl = "https://alaynai.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  title: {
    default: "Alayn AI — The Intelligent Operating System for Hospitality",
    template: "%s | Alayn AI",
  },
  description: "Alayn connects staff, inventory, orders, kitchen KDS, waste, and analytics into one AI-powered platform built specifically for restaurant and café operators.",
  keywords: [
    "Alayn",
    "Alayn AI",
    "alaynai.com",
    "Restaurant Operating System",
    "Hospitality AI",
    "Cafe POS",
    "Kitchen Display System",
    "Restaurant Management Software",
    "FEFO Inventory",
  ],
  applicationName: "Alayn AI",
  appleWebApp: {
    title: "Alayn AI",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Alayn AI — The Intelligent Operating System for Hospitality",
    description: "Alayn connects staff, inventory, orders, kitchen KDS, waste, and analytics into one AI-powered platform built specifically for restaurant and café operators.",
    url: siteUrl,
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
    title: "Alayn AI — The Intelligent Operating System for Hospitality",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Alayn AI",
        "alternateName": ["Alayn", "Alayn Hospitality Operating System", "alaynai.com"],
        "description": "The Intelligent Operating System for Modern Hospitality.",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        }
      },
      {
        "@type": "Brand",
        "@id": `${siteUrl}/#brand`,
        "name": "Alayn AI",
        "alternateName": ["Alayn", "Alayn Hospitality", "alaynai.com"],
        "url": siteUrl,
        "logo": `${siteUrl}/alaynlogo.png`
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        "name": "Alayn AI",
        "alternateName": ["Alayn", "Alayn Hospitality Operating System", "alaynai.com"],
        "operatingSystem": "Web, iOS, Android",
        "applicationCategory": "BusinessApplication",
        "description": "Alayn AI is an enterprise operating system unifying POS, kitchen KDS, FEFO inventory, and workforce matrix scheduling for restaurants and cafes.",
        "url": siteUrl,
        "creator": {
          "@type": "Organization",
          "name": "BRAHM Global Holdings",
          "url": "https://brahmglobalholdings.com"
        }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Alayn AI",
        "legalName": "Alayn AI Ltd",
        "alternateName": ["Alayn", "Alayn Hospitality", "alaynai.com"],
        "url": siteUrl,
        "logo": `${siteUrl}/alaynlogo.png`,
        "brand": {
          "@id": `${siteUrl}/#brand`
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "London",
          "addressCountry": "GB",
          "addressRegion": "Greater London"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "email": "sales@alaynai.com",
            "availableLanguage": ["English", "Hindi"]
          },
          {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "info@alaynai.com",
            "availableLanguage": ["English", "Hindi"]
          }
        ],
        "sameAs": [
          "https://www.instagram.com/alayn.ai/"
        ],
        "parentOrganization": {
          "@type": "Organization",
          "name": "BRAHM Global Holdings",
          "url": "https://brahmglobalholdings.com"
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="application-name" content="Alayn AI" />
        <meta name="apple-mobile-web-app-title" content="Alayn AI" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
