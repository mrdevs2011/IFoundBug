import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { PwaClient } from "@/components/PwaClient";

export const metadata: Metadata = {
  title: "IFoundBug: Where teams find and fix bugs",
  description: "A focused issue tracker for software teams. Report issues, discuss fixes, and generate actionable AI prompts. Private issues are accessible only through secure links.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IFoundBug",
  },
};

export const viewport: Viewport = {
  themeColor: "#010409",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#0d1117] text-[#f0f6fc] flex flex-col selection:bg-[#238636] selection:text-white font-sans">
        {children}
        <Footer />
        <PwaClient />
      </body>
    </html>
  );
}
