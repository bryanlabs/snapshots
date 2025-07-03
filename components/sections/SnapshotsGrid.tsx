"use client";

import { motion } from "framer-motion";
import { SnapshotCard, ChainSnapshot } from "../ui/SnapshotCard";
import { getAllChainSnapshots } from "@/lib/data/chains";

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

export const SnapshotsGrid = ({ searchQuery }: SnapshotsGridProps) => {
  const chains: ChainSnapshot[] = getAllChainSnapshots();

  const filteredChains = chains.filter(
    (chain) =>
      chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {filteredChains.map((chain, index) => (
        <motion.div key={index} variants={itemVariants}>
          <SnapshotCard chain={chain} />
        </motion.div>
      ))}
    </motion.div>
  );
};
