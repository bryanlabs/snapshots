"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getChainDataWithFallback } from "@/lib/utils/data-migration";
import { DynamicStats } from "@/lib/api/polkachu";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export const HeroStats = () => {
  const [stats, setStats] = useState<DynamicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { stats: dynamicStats } = await getChainDataWithFallback();
        setStats(dynamicStats);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics");
        // Fallback to static data on error
        setStats({
          totalChains: 18,
          updateFrequency: "Daily",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getDisplayStats = () => {
    if (!stats) return [];

    const baseStats = [
      {
        number: `${stats.totalChains}+`,
        label: "Chains Available",
        color: "text-foreground",
      },
      {
        number: stats.updateFrequency,
        label: "Updates",
        color: "text-foreground",
      },
    ];

    return baseStats;
  };

  if (error && !stats) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-2xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-red-500 text-sm">
          Unable to load statistics
        </motion.div>
      </motion.div>
    );
  }

  const displayStats = getDisplayStats();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16 max-w-4xl mx-auto"
    >
      {isLoading
        ? // Loading state with skeleton
          [...Array(2)].map((_, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center"
            >
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-slate-200 text-transparent rounded w-16 h-12 mx-auto"
              />
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2 + 0.1,
                }}
                className="text-sm md:text-base text-transparent bg-slate-200 rounded w-20 h-4 mx-auto"
              />
            </motion.div>
          ))
        : displayStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  type: "spring",
                  bounce: 0.4,
                }}
                className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${stat.color}`}
              >
                {stat.number}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
                className="text-sm md:text-base text-muted-foreground font-medium"
              >
                {stat.label}
              </motion.div>
            </motion.div>
          ))}
    </motion.div>
  );
};
