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
  title: "PostForge AI – AI LinkedIn Post Generator for Students, Professionals & Creators",
  description: "Generate professional LinkedIn posts, achievement posts, case studies, resume-based content, image-based content, and improve existing posts instantly using AI.",
  keywords: [
    "linkedin post generator",
    "ai linkedin post generator",
    "linkedin content creator",
    "linkedin post writer",
    "resume to linkedin post",
    "achievement post generator",
    "ai content generator",
    "image to linkedin post",
    "content improver",
    "postforge ai",
    "linkedin ai tool",
    "professional linkedin content",
    "linkedin post maker",
    "ai writing tool",
    "personal branding tool",
    "linkedin content for students",
    "linkedin content for professionals",
    "linkedin post from resume",
    "case study generator",
    "ai social media content"
  ],
  metadataBase: new URL("https://postforgeai.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PostForge AI – AI LinkedIn Post Generator for Students, Professionals & Creators",
    description: "Generate professional LinkedIn posts, achievement posts, case studies, resume-based content, image-based content, and improve existing posts instantly using AI.",
    url: "https://postforgeai.in",
    siteName: "PostForge AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://postforgeai.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "PostForge AI – AI LinkedIn Post Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PostForge AI – AI LinkedIn Post Generator for Students, Professionals & Creators",
    description: "Generate professional LinkedIn posts, achievement posts, case studies, resume-based content, image-based content, and improve existing posts instantly using AI.",
    images: ["https://postforgeai.in/og-image.png"],
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.ico",
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
      "logo": "https://postforgeai.in/logo.png",
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
      "description": "Generate professional LinkedIn posts, achievement posts, case studies, resume-based content, image-based content, and improve existing posts instantly using AI.",
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
