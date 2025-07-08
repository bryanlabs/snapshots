"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DownloadIcon, ViewIcon } from "../icons";
import { ChainIcon } from "./ChainIcon";
import Image from "next/image";
import { usePolkachuSnapshots } from "@/lib/hooks";
import { SkeletonSnapshotCard } from "./SkeletonLoader";

export interface ChainSnapshot {
  name: string;
  network: string;
  latestBlock: number;
  size: string;
  prunedSize: string;
  updated: string;
  nodeVersion: string;
  minimumGasPrice: string;
  symbol: string;
  denom: string;
  description: string;
  logo?: string;
  blockExplorerUrl?: string;
  github?: string;
  services: {
    rpc: boolean;
    api: boolean;
    grpc: boolean;
    stateSync: boolean;
    snapshot: boolean;
  };
  endpoints: {
    rpc?: string;
    api?: string;
    grpc?: string;
    stateSync?: string;
    snapshot?: string;
  };
}

interface SnapshotCardProps {
  chain: ChainSnapshot;
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const SnapshotCard = ({ chain, index = 0 }: SnapshotCardProps) => {
  const chainId = chain.name.toLowerCase().replace(/\s+/g, "");
  const { data: snapshots, isLoading: isLoadingSnapshots } =
    usePolkachuSnapshots({
      network: chainId,
      type: "mainnet",
    });

  // Show skeleton while loading
  if (isLoadingSnapshots) {
    return <SkeletonSnapshotCard index={index} />;
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-4">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {chain.logo ? (
            <Image
              src={chain.logo}
              alt={chain.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <ChainIcon name={chain.name} />
          )}
        </motion.div>
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xl font-bold text-foreground mb-1"
          >
            {chain.name}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            {snapshots?.snapshot.name}
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3 mb-6"
      >
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Latest Block:</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="font-mono text-sm font-medium text-foreground"
          >
            #{snapshots?.snapshot.block_height.toLocaleString()}
          </motion.span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Node Version:</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="text-sm font-medium text-foreground font-mono"
          >
            {chain.nodeVersion}
          </motion.span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Updated:</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="text-sm font-medium text-foreground"
          >
            {snapshots?.snapshot.time}
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex gap-3"
      >
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={snapshots?.snapshot.url}
          className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <DownloadIcon />
          Download
        </motion.a>
        <Link
          href={`/chains/${chainId}`}
          className="bg-slate-100 hover:bg-slate-200 text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <ViewIcon />
            Details
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
};
