import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { ScrollToTop } from "@/components/motion/scroll-to-top";
import { WebVitalsReporter } from "@/components/ops/web-vitals-reporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { MotionProvider } from "@/providers/motion-provider";
import { PlaybackProvider } from "@/providers/playback-provider";

const brandSans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND.themeColor,
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`dark ${brandSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><MotionProvider><AuthProvider><PlaybackProvider>{children}<BottomNav /><ScrollProgress /><ScrollToTop /><WebVitalsReporter /></PlaybackProvider></AuthProvider><Toaster theme="dark" /></MotionProvider></body>
    </html>
  );
}
