import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blockchain Snapshots - BryanLabs",
  description:
    "Fast, reliable blockchain snapshots for Cosmos ecosystem chains. Updated daily with pruned options available and global CDN delivery.",
  keywords: [
    "blockchain",
    "snapshots",
    "cosmos",
    "cosmos-sdk",
    "devops",
    "infrastructure",
  ],
  authors: [{ name: "BryanLabs" }],
  creator: "BryanLabs",
  publisher: "BryanLabs",
  openGraph: {
    title: "Blockchain Snapshots - BryanLabs",
    description:
      "Fast, reliable blockchain snapshots for Cosmos ecosystem chains",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blockchain Snapshots - BryanLabs",
    description:
      "Fast, reliable blockchain snapshots for Cosmos ecosystem chains",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
