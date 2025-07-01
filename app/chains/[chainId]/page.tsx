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
  NETWORK_OPTIONS,
} from "@/lib/data/chains";
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

  // Get chain data from centralized source
  const chain = getChainById(resolvedParams.chainId);

  // If chain not found, show 404
  if (!chain) {
    notFound();
  }

  // Get available networks for this chain and set default
  const availableNetworks = getAvailableNetworks(chain.id);
  const [selectedNetwork, setSelectedNetwork] = useState(
    availableNetworks.includes("Mainnet")
      ? "Mainnet"
      : availableNetworks[0] || "Mainnet"
  );

  // Get network-specific data
  const currentNetworkData = getNetworkData(chain.id, selectedNetwork);

  // If no network data found, fallback to mainnet
  if (!currentNetworkData && availableNetworks.length > 0) {
    const fallbackNetwork = availableNetworks[0];
    setSelectedNetwork(fallbackNetwork);
  }

  // Generate snapshot options from chain config for selected network
  const snapshots: SnapshotOption[] = toSnapshotOptions(chain, selectedNetwork);

  // Generate quick start commands for selected network
  const quickStartCommands = generateQuickStartCommands(
    chain.id,
    chain.binary.name,
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
            items={[{ label: "Snapshots", href: "/" }, { label: chain.name }]}
          />
        </motion.div>

        {/* Header */}
        <motion.div variants={sectionVariants} className="mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-foreground mb-4"
          >
            {chain.name} Snapshots
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-muted-foreground mb-6"
          >
            {chain.description}
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

          {/* Chain Information */}
          <motion.div variants={cardVariants}>
            <InfoCard title="Chain Information">
              <InfoRow
                label="Chain ID"
                value={currentNetworkData?.chainId || "N/A"}
              />
              <InfoRow label="Binary Version" value={chain.binary.version} />
              <InfoRow label="Binary Name" value={chain.binary.name} />
              <InfoRow
                label="Features"
                value={
                  <div className="flex flex-wrap gap-1">
                    {chain.features.map((feature, index) => (
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
                    href={chain.binary.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="text-accent hover:text-accent/80 underline"
                  >
                    View Repository
                  </motion.a>
                }
              />
              {chain.website && (
                <InfoRow
                  label="Official Website"
                  value={
                    <motion.a
                      href={chain.website}
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
              {chain.docs && (
                <InfoRow
                  label="Documentation"
                  value={
                    <motion.a
                      href={chain.docs}
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
              <InfoRow label="Minimum RAM" value={chain.hardware.minRam} />
              <InfoRow
                label="Recommended RAM"
                value={chain.hardware.recommendedRam}
              />
              <InfoRow
                label="Storage (Pruned)"
                value={chain.hardware.storagePruned}
              />
              <InfoRow
                label="Storage (Archive)"
                value={chain.hardware.storageArchive}
              />
              <InfoRow label="CPU" value={chain.hardware.cpu} />
              <InfoRow label="Network" value={chain.hardware.network} />
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

          {/* Network Information */}
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
                value={currentNetworkData?.rpcEndpoints.primary || "N/A"}
              />
              <InfoRow
                label="Secondary RPC"
                value={currentNetworkData?.rpcEndpoints.secondary || "N/A"}
              />
              <InfoRow
                label="Status"
                value={currentNetworkData?.status || "N/A"}
              />
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
                      `Binary mismatch: Ensure you're using ${chain.binary.version}`,
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
                    {chain.docs && (
                      <motion.p
                        whileHover={{ x: 5 }}
                        className="text-sm text-muted-foreground"
                      >
                        •{" "}
                        <a
                          href={chain.docs}
                          className="text-accent hover:text-accent/80 underline"
                        >
                          Official Documentation
                        </a>
                      </motion.p>
                    )}
                    {chain.github && (
                      <motion.p
                        whileHover={{ x: 5 }}
                        className="text-sm text-muted-foreground"
                      >
                        •{" "}
                        <a
                          href={chain.github}
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
