import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { SplashScreen } from "@/components/SplashScreen";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://swift-type-two.vercel.app");

const ogImageUrl = `${siteUrl}/og-image-v2.jpg`;

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Swift Type – Train Your Fingers, Master Your Keyboard",
    template: "%s | Swift Type",
  },
  description:
    "Swift Type is an AI Powered Next generation, fast, adaptive typing trainer. Practice touch typing, improve your WPM, and master your keyboard with real-time feedback and beautiful analytics.",
  keywords: [
    "typing trainer",
    "touch typing",
    "WPM",
    "keyboard practice",
    "typing speed",
    "learn to type",
    "typing test",
    "typing game",
    "adaptive typing",
    "typing tutor",
    "fast typing",
  ],
  authors: [{ name: "Swift Type" }],
  creator: "Swift Type",
  applicationName: "Swift Type",
  generator: "Next.js",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Swift Type",
    title: "Swift Type – Train Your Fingers, Master Your Keyboard",
    description:
      "AI Powered Next-gen typing trainer. Practice touch typing, improve your WPM, and master your keyboard with real-time feedback and beautiful analytics.",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Swift Type – Adaptive Typing Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swift Type – Train Your Fingers, Master Your Keyboard",
    description:
      "Adaptive typing trainer, teaches touch typing, how to type fast and accurate with AI drills.",
    images: [ogImageUrl],
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
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.jpg",
    apple: "/logo-192.jpg",
    shortcut: "/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-dvh overflow-hidden flex items-start justify-center px-4 sm:px-5`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange={false}
        >
          <SessionProvider>
            <SplashScreen>{children}</SplashScreen>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
