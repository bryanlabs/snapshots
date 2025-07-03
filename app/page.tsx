"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { SearchIcon, HeroStats, SnapshotsGrid } from "@/components";

// Animation variants
const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
    },
  },
};

const searchVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.3,
    },
  },
};

const statsVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.7,
    },
  },
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.main
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        className="flex-1 flex items-center justify-center px-6 py-16 md:py-24"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/bryanlabs_banner.png"
              alt="BryanLabs Logo"
              width={200}
              height={200}
            />
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            variants={heroVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight tracking-tight"
          >
            Blockchain Snapshots
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p
            variants={heroVariants}
            className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            Fast, reliable blockchain snapshots for Cosmos ecosystem chains
          </motion.p>

          {/* Feature Highlights */}
          <motion.div
            variants={searchVariants}
            className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-12 text-muted-foreground"
          >
            <motion.span whileHover={{ scale: 1.05 }} className="font-medium">
              Updated daily
            </motion.span>
            <span className="text-muted font-semibold hidden sm:inline">•</span>
            <motion.span whileHover={{ scale: 1.05 }} className="font-medium">
              Pruned options available
            </motion.span>
            <span className="text-muted font-semibold hidden sm:inline">•</span>
            <motion.span whileHover={{ scale: 1.05 }} className="font-medium">
              Global CDN delivery
            </motion.span>
          </motion.div>

          {/* Hero Statistics */}
          <motion.div variants={statsVariants}>
            <HeroStats />
          </motion.div>
        </div>
      </motion.main>

      {/* Snapshots Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={gridVariants}
        className="py-16 px-6 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Available Snapshots
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose from our collection of daily-updated blockchain snapshots,
              available in both full and pruned versions
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative max-w-md mx-auto">
                <SearchIcon />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  placeholder="Search chains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-lg border-2 border-border rounded-xl bg-white transition-all duration-200 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-muted font-medium"
                  aria-label="Search blockchain chains"
                />
              </div>
            </motion.div>
          </motion.div>

          <SnapshotsGrid searchQuery={searchQuery} />
        </div>
      </motion.section>
    </div>
  );
}
