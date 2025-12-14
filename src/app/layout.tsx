import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers";
import RealtimeNotifications from "@/components/realtime-notifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instagram Clone - Share Your Moments",
  description: "A modern Instagram clone built with Next.js, TypeScript, and Tailwind CSS",
  keywords: ["Instagram", "Clone", "Next.js", "TypeScript", "Tailwind CSS", "Social Media"],
  authors: [{ name: "Instagram Clone Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Instagram Clone",
    description: "Share your moments with the world",
    url: "https://chat.z.ai",
    siteName: "Instagram Clone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Clone",
    description: "Share your moments with the world",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          {/* <RealtimeNotifications /> */}
        </Providers>
      </body>
    </html>
  );
}
