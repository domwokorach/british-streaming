import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { PlaybackProvider } from "@/providers/playback-provider";

// Netflix Sans is proprietary and not distributed on any public font CDN,
// so Inter (Bold/Regular/Italic) stands in as a freely-licensed lookalike.
const netflixSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Netflix — Watch TV Shows Online, Watch Movies Online",
  description: "A cinematic streaming experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${netflixSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><MotionConfig reducedMotion="user"><AuthProvider><PlaybackProvider>{children}</PlaybackProvider></AuthProvider><Toaster theme="dark" /></MotionConfig></body>
    </html>
  );
}
