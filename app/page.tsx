"use client";

import Image from "next/image";
import { useState } from "react";
import { SearchIcon, HeroStats, SnapshotsGrid } from "@/components";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 flex items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Image
            src="/bryanlabs_banner.png"
            alt="BryanLabs Logo"
            width={200}
            height={200}
          />
          {/* Hero Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
            Blockchain Snapshots
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Fast, reliable blockchain snapshots for Cosmos ecosystem chains
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-12 text-muted-foreground">
            <span className="font-medium">Updated daily</span>
            <span className="text-muted font-semibold hidden sm:inline">•</span>
            <span className="font-medium">Pruned options available</span>
            <span className="text-muted font-semibold hidden sm:inline">•</span>
            <span className="font-medium">Global CDN delivery</span>
          </div>

          {/* Hero Statistics */}
          <HeroStats />
        </div>
      </main>

      {/* Snapshots Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Available Snapshots
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose from our collection of daily-updated blockchain snapshots,
              available in both full and pruned versions
            </p>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md mx-auto">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search chains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-lg border-2 border-border rounded-xl bg-white transition-all duration-200 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-muted font-medium"
                  aria-label="Search blockchain chains"
                />
              </div>
            </div>
          </div>

          <SnapshotsGrid searchQuery={searchQuery} />
        </div>
      </section>
    </div>
  );
}
