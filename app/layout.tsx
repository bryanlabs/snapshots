import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Header } from "@/components/common/Header";
import { BandwidthIndicator } from "@/components/common/BandwidthIndicator";
import { LayoutProvider } from "@/components/providers/LayoutProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Blockchain Snapshots - BryanLabs",
    template: "%s | BryanLabs Snapshots",
  },
  description:
    "Fast, reliable blockchain snapshots for Cosmos ecosystem chains. Updated daily with pruned options available and global CDN delivery. Download latest snapshots for Juno, Osmosis, Cosmos Hub, and more.",
  keywords: [
    "blockchain",
    "snapshots",
    "cosmos",
    "cosmos-sdk",
    "devops",
    "infrastructure",
    "juno",
    "osmosis",
    "cosmos hub",
    "blockchain data",
    "node synchronization",
    "pruned snapshots",
    "state sync",
  ],
  authors: [{ name: "BryanLabs", url: "https://bryanlabs.net" }],
  creator: "BryanLabs",
  publisher: "BryanLabs",
  category: "Technology",
  classification: "Blockchain Infrastructure",
  openGraph: {
    title: "Blockchain Snapshots - BryanLabs",
    description:
      "Fast, reliable blockchain snapshots for Cosmos ecosystem chains. Updated daily with global CDN delivery.",
    type: "website",
    locale: "en_US",
    siteName: "BryanLabs Snapshots",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blockchain Snapshots - BryanLabs",
    description:
      "Fast, reliable blockchain snapshots for Cosmos ecosystem chains",
    creator: "@bryanlabs",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          <Header />
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <BandwidthIndicator />
        </AuthProvider>
      </body>
    </html>
  );
}
