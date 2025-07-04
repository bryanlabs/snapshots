"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { SnapshotCard, ChainSnapshot } from "../ui/SnapshotCard";
import { getChainDataWithFallback } from "@/lib/utils/data-migration";

interface SnapshotsGridProps {
  searchQuery: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      duration: 0.5,
    },
  },
};

// Skeleton loading component
const SkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-xl border border-border p-6"
  >
    <div className="flex items-start gap-4 mb-4">
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: index * 0.1,
        }}
        className="w-12 h-12 bg-slate-200 rounded-full"
      />
      <div className="flex-1">
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1 + 0.1,
          }}
          className="h-6 bg-slate-200 rounded mb-2 w-3/4"
        />
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1 + 0.2,
          }}
          className="h-4 bg-slate-200 rounded w-1/2"
        />
      </div>
    </div>

    <div className="space-y-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1 + i * 0.05,
            }}
            className="h-4 bg-slate-200 rounded w-1/3"
          />
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1 + i * 0.05 + 0.1,
            }}
            className="h-4 bg-slate-200 rounded w-1/4"
          />
        </div>
      ))}
    </div>

    <div className="flex gap-3">
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: index * 0.1 + 0.3,
        }}
        className="flex-1 h-10 bg-slate-200 rounded-lg"
      />
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: index * 0.1 + 0.4,
        }}
        className="h-10 w-20 bg-slate-200 rounded-lg"
      />
    </div>
  </motion.div>
);

export const SnapshotsGrid = ({ searchQuery }: SnapshotsGridProps) => {
  const [chains, setChains] = useState<ChainSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { chains: enhancedChains, isLive: liveStatus } =
          await getChainDataWithFallback();
        setChains(enhancedChains);
        setIsLive(liveStatus);
      } catch (err) {
        console.error("Error fetching chains:", err);
        setError("Failed to load chain data");
        setChains([]); // Empty array on error
        setIsLive(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChains();
  }, []);

  const filteredChains = chains.filter(
    (chain) =>
      chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error && chains.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-red-500 text-lg font-medium mb-2"
        >
          Unable to load blockchain data
        </motion.div>
        <p className="text-muted-foreground">
          Please check your connection and try again later.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </motion.div>
    );
  }

  if (filteredChains.length === 0 && searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-muted-foreground text-lg font-medium mb-2"
        >
          No chains found for &quot;{searchQuery}&quot;
        </motion.div>
        <p className="text-muted-foreground">
          Try searching with different keywords or check the spelling.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {filteredChains.map((chain, index) => (
        <motion.div key={`${chain.network}-${index}`} variants={itemVariants}>
          <SnapshotCard chain={chain} />
        </motion.div>
      ))}

      {/* Show count info */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-full text-center text-sm text-muted-foreground mt-8"
        >
          {searchQuery ? (
            <>
              Showing {filteredChains.length} of {chains.length} chains matching
              &quot;{searchQuery}&quot;
            </>
          ) : (
            <>
              Showing {filteredChains.length} blockchain networks with{" "}
              {isLive ? "live" : "cached"} data
              {isLive ? " from Polkachu" : " (API unavailable)"}
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
