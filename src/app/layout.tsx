import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
    "Swift Type is a free, fast, adaptive typing trainer. Practice touch typing, improve your WPM, and master your keyboard with real-time feedback and beautiful analytics.",
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
  ],
  authors: [{ name: "Swift Type" }],
  creator: "Swift Type",
  applicationName: "Swift Type",
  generator: "Next.js",
  metadataBase: new URL("https://swifttype.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://swifttype.app",
    siteName: "Swift Type",
    title: "Swift Type – Train Your Fingers, Master Your Keyboard",
    description:
      "Free adaptive typing trainer with real-time WPM stats, finger-color keyboard, and smart AI-powered drills.",
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
    icon: "/favicon.png",
    apple: "/logo-192.png",
    shortcut: "/favicon.png",
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans overflow-hidden flex items-center justify-center p-4`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SplashScreen>{children}</SplashScreen>
        </ThemeProvider>
      </body>
    </html>
  );
}
