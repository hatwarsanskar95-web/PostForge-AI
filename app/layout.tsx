import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CreditModalProvider } from "@/components/ui/credit-modal-provider";
import { UsageProvider } from "@/contexts/usage-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PostForge AI",
  description: "AI-powered LinkedIn content generator for professionals, students, creators and job seekers.",
  keywords: [
    "LinkedIn",
    "AI content generation",
    "personal branding",
    "content creation",
    "LinkedIn posts",
    "professional networking"
  ],
  metadataBase: new URL("https://postforgeai.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PostForge AI",
    description: "AI-powered LinkedIn content generator for professionals, students, creators and job seekers.",
    url: "https://postforgeai.in",
    siteName: "PostForge AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostForge AI",
    description: "AI-powered LinkedIn content generator for professionals, students, creators and job seekers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://postforgeai.in/#organization",
      "name": "PostForge AI",
      "url": "https://postforgeai.in",
      "logo": "https://postforgeai.in/favicon.ico",
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "@id": "https://postforgeai.in/#website",
      "url": "https://postforgeai.in",
      "name": "PostForge AI",
      "publisher": {
        "@id": "https://postforgeai.in/#organization"
      }
    },
    {
      "@type": "SoftwareApplication",
      "name": "PostForge AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://postforgeai.in",
      "description": "AI-powered LinkedIn content generator for professionals, students, creators and job seekers.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-black text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <UsageProvider>
          <CreditModalProvider>
            {children}
          </CreditModalProvider>
        </UsageProvider>
      </body>
    </html>
  );
}
