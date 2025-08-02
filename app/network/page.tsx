import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Network Infrastructure - BryanLabs Snapshots",
  description:
    "Learn about our robust global network infrastructure powered by DACS-IX, featuring direct peering with AWS, Google, CloudFlare, and other major providers across multiple data centers.",
  keywords: [
    "network infrastructure",
    "DACS-IX",
    "peering",
    "AWS",
    "Google",
    "CloudFlare",
    "data centers",
    "BGP",
    "AS 401711",
    "internet exchange",
    "global connectivity",
    "enterprise infrastructure",
  ],
  openGraph: {
    title: "Network Infrastructure - DACS-IX Partnership",
    description:
      "Enterprise-grade global connectivity through DACS-IX with direct peering to major cloud providers and CDNs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Network Infrastructure - DACS-IX Partnership",
    description:
      "Enterprise-grade global connectivity through DACS-IX with direct peering to major cloud providers and CDNs.",
  },
};

const majorPeers = [
  { name: "Amazon Web Services", icon: "🟠", category: "Cloud Provider" },
  { name: "Google Cloud", icon: "🔵", category: "Cloud Provider" },
  { name: "Microsoft Azure", icon: "🔷", category: "Cloud Provider" },
  { name: "Cloudflare", icon: "🟠", category: "CDN & Security" },
  { name: "Apple", icon: "🍎", category: "Technology" },
  { name: "Netflix", icon: "🔴", category: "Content Delivery" },
  { name: "Meta (Facebook)", icon: "🔵", category: "Social Media" },
  { name: "GitHub", icon: "⚫", category: "Developer Platform" },
  { name: "IBM Cloud", icon: "🔷", category: "Cloud Provider" },
  { name: "SpaceX Starlink", icon: "🚀", category: "Satellite Internet" },
  { name: "Cisco", icon: "🔵", category: "Networking" },
];

const exchanges = [
  {
    name: "Equinix Internet Exchange",
    location: "Ashburn, VA",
    description: "Major East Coast peering hub with global connectivity",
  },
  {
    name: "New York International Internet Exchange (NYIIX)",
    location: "New York, NY",
    description: "Premier Northeast internet exchange point",
  },
  {
    name: "Fremont Cabal Internet Exchange (FCIX)",
    location: "Fremont, CA",
    description: "West Coast community-driven internet exchange",
  },
];

const dataCenter = {
  primary: {
    address: "12401 Prosperity Dr, Silver Spring, MD 20904",
    phone: "(410) 760-3447",
    region: "East Region",
  },
  locations: [
    "Ashburn, VA - Primary peering hub",
    "Reston, VA - Secondary connectivity",
    "Baltimore, MD - Regional presence",
    "Silver Spring, MD - Operations center",
  ],
};

const portSpeeds = ["1 Gbps", "10 Gbps", "40 Gbps", "100 Gbps"];

export default function NetworkPage() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-16">
        <div className="container mx-auto px-4 hero-content">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Global Network Infrastructure
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Enterprise-grade connectivity powered by DACS-IX peering fabric
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-gray-300">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Direct cloud peering
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Multiple data centers
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AS 401711
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DACS-IX Partnership Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powered by DACS-IX
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our partnership with DACS-IX provides enterprise-grade connectivity through their 
              extensive peering fabric, ensuring fast, reliable access to blockchain snapshots 
              from anywhere in the world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414L11.414 11l3.293 3.293a1 1 0 01-1.414 1.414L10 12.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 11 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Internet Exchange Peering
                </CardTitle>
                <CardDescription>
                  Direct connections to major internet exchanges for optimal routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchanges.map((exchange, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4">
                      <h4 className="font-medium text-foreground">{exchange.name}</h4>
                      <p className="text-sm text-muted-foreground">{exchange.location}</p>
                      <p className="text-sm text-muted-foreground">{exchange.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  Regional Coverage
                </CardTitle>
                <CardDescription>
                  Strategic data center locations across the East Region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataCenter.locations.map((location, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">{location}</span>
                    </div>
                  ))}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Operations Center</h4>
                    <p className="text-sm text-muted-foreground mb-1">{dataCenter.primary.address}</p>
                    <p className="text-sm text-muted-foreground">{dataCenter.primary.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Major Peers Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Direct Peering Partners
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our network peers directly with major cloud providers, CDNs, and technology companies, 
              ensuring optimal performance and reduced latency for your snapshot downloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {majorPeers.map((peer, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{peer.icon}</span>
                    <div>
                      <h3 className="font-medium text-foreground">{peer.name}</h3>
                      <p className="text-sm text-muted-foreground">{peer.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Technical Specifications
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Enterprise-grade infrastructure designed for high-performance blockchain data delivery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Port Speeds
                </CardTitle>
                <CardDescription>
                  High-bandwidth connectivity options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {portSpeeds.map((speed, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-foreground">{speed}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                  </div>
                  BGP Information
                </CardTitle>
                <CardDescription>
                  Autonomous System details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">AS Number</h4>
                    <p className="text-lg font-mono text-foreground">AS 401711</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Registry</h4>
                    <Link 
                      href="https://whois.arin.net/rest/asn/AS401711" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      ARIN Registry →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Reliability
                </CardTitle>
                <CardDescription>
                  Enterprise SLA and uptime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Uptime SLA</h4>
                    <p className="text-lg font-semibold text-green-600">99.9%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Redundancy</h4>
                    <p className="text-sm text-foreground">Multi-path routing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experience the Difference
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to experience enterprise-grade blockchain snapshot delivery? 
            Start downloading from our globally distributed network today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                Browse Snapshots
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}