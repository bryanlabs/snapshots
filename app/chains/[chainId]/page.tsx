"use client";

import { use } from "react";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  NetworkSelector,
  SnapshotTable,
  CopyableValue,
} from "@/components";
import { SkeletonSnapshotTable } from "@/components/ui/SkeletonLoader";
import { getChainById } from "@/lib/data/chains";
import { useEnhancedChainData } from "@/lib/hooks/useEnhancedChainData";
import { notFound } from "next/navigation";
import { usePolkachuSnapshots, useNetworkTabs } from "@/lib/hooks";

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

interface ChainDetailProps {
  params: Promise<{
    chainId: string;
  }>;
}

export default function ChainDetail({ params }: ChainDetailProps) {
  // Unwrap params Promise for Next.js 15 compatibility
  const resolvedParams = use(params);
  const chainId =
    resolvedParams.chainId === "cosmoshub" ? "cosmos" : resolvedParams.chainId;

  // Get static chain data first (required for routing)
  const staticConfig = getChainById(resolvedParams.chainId);

  // If static config not found, show 404
  if (!staticConfig) {
    notFound();
  }

  // Use the enhanced chain data hook
  const { enrichedChain, liveData, isLoadingLive, liveDataError } =
    useEnhancedChainData(staticConfig, chainId);

  // Use the network tabs hook for tab management
  const {
    selectedNetwork,
    setSelectedNetwork,
    availableNetworks,
    currentTabValue,
  } = useNetworkTabs(enrichedChain.id);

  const { data: snapshots, isLoading: isLoadingSnapshots } =
    usePolkachuSnapshots({
      network: chainId,
      type: currentTabValue.apiType,
    });

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: enrichedChain.name, href: "" },
            ]}
          />
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-foreground"
            >
              {enrichedChain.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2 mt-2"
            >
              {isLoadingLive ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Loading live data...
                </div>
              ) : liveDataError ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  API error - using static data
                </div>
              ) : liveData ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Live data
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Static data
                </div>
              )}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-muted-foreground mb-6"
          >
            {enrichedChain.description}
          </motion.p>

          {/* Network Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <NetworkSelector
              options={availableNetworks}
              defaultSelected={selectedNetwork}
              onSelect={setSelectedNetwork}
            />
          </motion.div>
        </motion.div>

        {/* Chain Information Card */}
        {snapshots && (
          <motion.div variants={sectionVariants} className="mb-8">
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Chain Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Node Version:
                  </span>
                  <CopyableValue
                    value={enrichedChain.binary?.version || "N/A"}
                    label="node version"
                  >
                    <span className="text-sm font-medium text-foreground font-mono">
                      {enrichedChain.binary?.version || "N/A"}
                    </span>
                  </CopyableValue>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Snapshot Name:
                  </span>
                  <CopyableValue
                    value={snapshots.snapshot.name}
                    label="snapshot name"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {snapshots.snapshot.name}
                    </span>
                  </CopyableValue>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Snapshot Options Table */}
        {isLoadingSnapshots ? (
          <motion.div variants={sectionVariants} className="mb-8">
            <SkeletonSnapshotTable />
          </motion.div>
        ) : snapshots ? (
          <motion.div variants={sectionVariants} className="mb-8">
            <SnapshotTable snapshotData={snapshots} />
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
