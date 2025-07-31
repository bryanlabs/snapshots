import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { LayoutProvider } from "@/components/providers/LayoutProvider";
import { Providers } from "@/components/providers";
import { WebVitals } from "@/components/monitoring/WebVitals";
import { RealUserMonitoring } from "@/components/monitoring/RealUserMonitoring";
import { SentryUserContext } from "@/components/monitoring/SentryUserContext";
import { MobileMenu } from "@/components/mobile/MobileMenu";

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
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: '/favicon.svg?v=2',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For iPhone notch
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent FOUC (Flash of Unstyled Content) for theme
              (function() {
                const savedTheme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = savedTheme || systemTheme;
                
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <WebVitals />
          <RealUserMonitoring />
          {/* <SentryUserContext /> */}
          <Header />
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <MobileMenu />
        </Providers>
      </body>
    </html>
  );
}