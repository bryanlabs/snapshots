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
          uptime: "99.9%",
          activeServices: 0,
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
      {
        number: stats.uptime,
        label: "Uptime",
        color: "text-foreground",
      },
    ];

    // Add average staking APR if available
    if (stats.averageStakingApr) {
      baseStats.push({
        number: stats.averageStakingApr,
        label: "Avg Staking APR",
        color: "text-green-600",
      });
    }

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
      className={`grid grid-cols-1 ${
        displayStats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"
      } gap-8 max-w-4xl mx-auto`}
    >
      {displayStats.map((stat, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            y: -5,
            transition: { duration: 0.2 },
          }}
          className="text-center group cursor-pointer transition-transform duration-200"
        >
          {isLoading ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                scale: {
                  delay: index * 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                },
                opacity: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="text-3xl md:text-4xl font-extrabold mb-2 leading-none text-muted-foreground"
            >
              ...
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: index * 0.2,
                duration: 0.5,
                type: "spring",
                stiffness: 100,
              }}
              className={`text-3xl md:text-4xl font-extrabold mb-2 leading-none ${stat.color}`}
            >
              {stat.number}
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.2 + 0.3 }}
            className="text-sm font-medium text-muted uppercase tracking-wider"
          >
            {stat.label}
          </motion.div>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.2 + 0.5 }}
              className="text-xs text-muted-foreground mt-1"
            >
              Loading...
            </motion.div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};
