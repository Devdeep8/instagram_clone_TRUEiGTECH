import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers";
import Link from "next/link";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Instagram Clone - Share Your Moments",
  description: "A modern Instagram clone built with Next.js, TypeScript, and Tailwind CSS",
  keywords: ["Instagram", "Clone", "Next.js", "TypeScript", "Tailwind CSS", "Social Media"],
  authors: [{ name: "Instagram Clone Team" }],
  icons: {
    icon: "https://devdeep.dev/_next/image?url=%2Fimages%2Fdev.jpg&w=256&q=100",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-16x16.png",
  },
  openGraph: {
    title: "Instagram Clone",
    description: "Share your moments with the world",
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
    <html lang="en">
      <body className={`${poppins.variable} ${montserrat.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
          {/* <RealtimeNotifications /> */}
          
          {/* Portfolio Link */}
          <Link 
            href="https://devdeep.dev" 
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 font-medium"
          >
            View My Portfolio
          </Link>
        </Providers>
      </body>
    </html>
  );
}