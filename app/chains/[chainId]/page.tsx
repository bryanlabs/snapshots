"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  NetworkSelector,
  SnapshotTable,
  CodeBlock,
  InfoCard,
  InfoRow,
  SnapshotOption,
} from "@/components";
import {
  getChainById,
  toSnapshotOptions,
  generateQuickStartCommands,
  getAvailableNetworks,
  getNetworkData,
} from "@/lib/data/chains";
import { useEnhancedChainData } from "@/lib/hooks/useEnhancedChainData";
import { notFound } from "next/navigation";

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

const cardVariants = {
  hidden: { opacity: 1, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
  const {
    enrichedChain,
    liveData,
    isLoadingLive,
    liveDataError,
    enhancedInfo,
  } = useEnhancedChainData(staticConfig, chainId);

  // Get available networks for this chain and set default
  const availableNetworks = getAvailableNetworks(enrichedChain.id);
  const [selectedNetwork, setSelectedNetwork] = useState(
    availableNetworks.includes("Mainnet")
      ? "Mainnet"
      : availableNetworks[0] || "Mainnet"
  );

  // Get network-specific data
  const currentNetworkData = getNetworkData(enrichedChain.id, selectedNetwork);

  // If no network data found, fallback to mainnet
  if (!currentNetworkData && availableNetworks.length > 0) {
    const fallbackNetwork = availableNetworks[0];
    setSelectedNetwork(fallbackNetwork);
  }

  // Generate snapshot options from enriched chain config for selected network
  const snapshots: SnapshotOption[] = toSnapshotOptions(
    enrichedChain,
    selectedNetwork
  );

  // Generate quick start commands for selected network
  const quickStartCommands = generateQuickStartCommands(
    enrichedChain.id,
    enrichedChain.binary.name,
    selectedNetwork
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <motion.div variants={sectionVariants}>
          <Breadcrumb
            items={[
              { label: "Snapshots", href: "/" },
              { label: enrichedChain.name },
            ]}
          />
        </motion.div>

        {/* Header */}
        <motion.div variants={sectionVariants} className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-foreground"
            >
              {enrichedChain.name} Snapshots
            </motion.h1>

            {/* Live data indicator */}
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

        {/* Snapshot Options Table */}
        <motion.div variants={sectionVariants} className="mb-8">
          <SnapshotTable snapshots={snapshots} />
        </motion.div>

        {/* Rich Content Sections */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Quick Start Guide */}
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <InfoCard title="Quick Start Guide">
              <p className="text-muted-foreground mb-4">
                Follow these steps to quickly set up your node with our
                snapshots:
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "1. Download Snapshot",
                    code: quickStartCommands.download,
                    description: "Download latest snapshot",
                  },
                  {
                    title: "2. Stop Your Node",
                    code: quickStartCommands.stop,
                    description: "Stop the node service",
                  },
                  {
                    title: "3. Backup Current Data",
                    code: quickStartCommands.backup,
                    description: "Backup existing data",
                  },
                  {
                    title: "4. Extract & Restore",
                    code: `${quickStartCommands.extract}\n${quickStartCommands.restore}`,
                    description: "Extract and restore snapshot",
                  },
                  {
                    title: "5. Start Your Node",
                    code: quickStartCommands.start,
                    description: "Start the node service",
                  },
                  {
                    title: "6. Verify Sync Status",
                    code: quickStartCommands.verify,
                    description: "Check node sync status",
                  },
                  {
                    title: "7. Cleanup (Optional)",
                    code: quickStartCommands.cleanup,
                    description: "Remove downloaded files",
                  },
                ].map((step, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-foreground mb-2">
                      {step.title}
                    </h4>
                    <CodeBlock code={step.code} title={step.description} />
                  </div>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* Chain Information - Enhanced with live data */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Chain Information">
              <InfoRow
                label="Chain ID"
                value={currentNetworkData?.chainId || "N/A"}
              />
              <InfoRow
                label="Binary Version"
                value={
                  <div className="flex items-center gap-2">
                    {enrichedChain.binary.version}
                    {liveData &&
                      liveData.node_version !== staticConfig.binary.version && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Live
                        </span>
                      )}
                  </div>
                }
              />
              <InfoRow label="Binary Name" value={enrichedChain.binary.name} />

              {/* Enhanced info from live data */}
              {enhancedInfo &&
                enhancedInfo.map((info, index) => (
                  <InfoRow
                    key={index}
                    label={info.label}
                    value={
                      <div
                        className={`flex items-center gap-2 ${
                          info.type === "gas"
                            ? "text-green-600"
                            : info.type === "apr"
                            ? "text-blue-600"
                            : "text-foreground"
                        }`}
                      >
                        {info.isArray ? (
                          <div className="flex flex-col gap-1">
                            {(info.value as string[]).map((item, idx) => (
                              <span
                                key={idx}
                                className="font-medium font-mono text-sm"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium">
                            {info.value as string}
                          </span>
                        )}
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Live
                        </span>
                      </div>
                    }
                  />
                ))}

              <InfoRow
                label="Features"
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {enrichedChain.features.map((feature, index) => (
                      <motion.span
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className="bg-slate-100 text-xs px-2 py-1 rounded cursor-default"
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                }
              />
              <InfoRow
                label="GitHub Repository"
                value={
                  <motion.a
                    href={enrichedChain.binary.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="text-accent hover:text-accent/80 underline"
                  >
                    View Repository
                  </motion.a>
                }
              />
              {enrichedChain.website && (
                <InfoRow
                  label="Official Website"
                  value={
                    <motion.a
                      href={enrichedChain.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      className="text-accent hover:text-accent/80 underline"
                    >
                      Visit Website
                    </motion.a>
                  }
                />
              )}
              {enrichedChain.docs && (
                <InfoRow
                  label="Documentation"
                  value={
                    <motion.a
                      href={enrichedChain.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      className="text-accent hover:text-accent/80 underline"
                    >
                      Read Docs
                    </motion.a>
                  }
                />
              )}
            </InfoCard>
          </motion.div>

          {/* Hardware Requirements */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Hardware Requirements">
              <InfoRow
                label="Minimum RAM"
                value={enrichedChain.hardware.minRam}
              />
              <InfoRow
                label="Recommended RAM"
                value={enrichedChain.hardware.recommendedRam}
              />
              <InfoRow
                label="Storage (Pruned)"
                value={enrichedChain.hardware.storagePruned}
              />
              <InfoRow
                label="Storage (Archive)"
                value={enrichedChain.hardware.storageArchive}
              />
              <InfoRow label="CPU" value={enrichedChain.hardware.cpu} />
              <InfoRow label="Network" value={enrichedChain.hardware.network} />
            </InfoCard>
          </motion.div>

          {/* Sync Instructions */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Sync Instructions">
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-slate-50 rounded-lg"
                >
                  <h4 className="font-semibold text-foreground mb-2">
                    State Sync (Recommended)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fastest way to sync. Downloads minimal state data.
                  </p>
                  <CodeBlock
                    code={`# Enable state sync in config.toml
[statesync]
enable = true
rpc_servers = "${currentNetworkData?.rpcEndpoints.primary || "N/A"},${
                      currentNetworkData?.rpcEndpoints.secondary || "N/A"
                    }"`}
                    language="toml"
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-slate-50 rounded-lg"
                >
                  <h4 className="font-semibold text-foreground mb-2">
                    Snapshot Sync
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use our pre-built snapshots for quick bootstrap.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-slate-50 rounded-lg"
                >
                  <h4 className="font-semibold text-foreground mb-2">
                    Full Sync
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Sync from genesis (takes several days).
                  </p>
                </motion.div>
              </div>
            </InfoCard>
          </motion.div>

          {/* Network Information - Enhanced with live RPC endpoints */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Network Information">
              <InfoRow label="Selected Network" value={selectedNetwork} />
              <InfoRow
                label="Chain ID"
                value={currentNetworkData?.chainId || "N/A"}
              />
              <InfoRow
                label="Latest Block"
                value={
                  currentNetworkData
                    ? `#${currentNetworkData.latestBlock.toLocaleString()}`
                    : "N/A"
                }
              />
              <InfoRow
                label="Last Updated"
                value={currentNetworkData?.lastUpdated || "N/A"}
              />
              <InfoRow
                label="Primary RPC"
                value={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {currentNetworkData?.rpcEndpoints.primary || "N/A"}
                    </span>
                    {liveData?.polkachu_services?.rpc?.url &&
                      liveData.polkachu_services.rpc.url !==
                        staticConfig.networks.mainnet?.rpcEndpoints.primary && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Live
                        </span>
                      )}
                  </div>
                }
              />
              <InfoRow
                label="Secondary RPC"
                value={currentNetworkData?.rpcEndpoints.secondary || "N/A"}
              />
              <InfoRow
                label="Status"
                value={currentNetworkData?.status || "N/A"}
              />

              {/* Show available Polkachu services if live data is available */}
              {liveData?.polkachu_services && (
                <InfoRow
                  label="Available Services"
                  value={
                    <div className="flex flex-wrap gap-1 mt-1 justify-end">
                      {Object.entries(liveData.polkachu_services).map(
                        ([service, config]) =>
                          config &&
                          typeof config === "object" &&
                          "active" in config &&
                          config.active && (
                            <span
                              key={service}
                              className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                            >
                              {service.toUpperCase()}
                            </span>
                          )
                      )}
                    </div>
                  }
                />
              )}
            </InfoCard>
          </motion.div>

          {/* Troubleshooting */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Troubleshooting">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Common Issues
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {[
                      "Snapshot corruption: Re-download and verify checksums",
                      "Permission errors: Ensure correct file ownership",
                      "Disk space: Ensure adequate free space before extraction",
                      "Network timeouts: Use a reliable internet connection",
                      `Binary mismatch: Ensure you're using ${enrichedChain.binary.version}`,
                    ].map((issue, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        • <strong>{issue.split(":")[0]}:</strong>{" "}
                        {issue.split(":")[1]}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Support Resources
                  </h4>
                  <div className="space-y-2">
                    <motion.p
                      whileHover={{ x: 5 }}
                      className="text-sm text-muted-foreground"
                    >
                      • BryanLabs Discord: Get community support
                    </motion.p>
                    {enrichedChain.docs && (
                      <motion.p
                        whileHover={{ x: 5 }}
                        className="text-sm text-muted-foreground"
                      >
                        •{" "}
                        <a
                          href={enrichedChain.docs}
                          className="text-accent hover:text-accent/80 underline"
                        >
                          Official Documentation
                        </a>
                      </motion.p>
                    )}
                    {enrichedChain.github && (
                      <motion.p
                        whileHover={{ x: 5 }}
                        className="text-sm text-muted-foreground"
                      >
                        •{" "}
                        <a
                          href={enrichedChain.github}
                          className="text-accent hover:text-accent/80 underline"
                        >
                          GitHub Issues
                        </a>
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
