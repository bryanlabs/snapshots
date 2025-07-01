"use client";

import { useState, use } from "react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: "Snapshots", href: "/" }, { label: chain.name }]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {chain.name} Snapshots
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {chain.description}
          </p>

          {/* Network Selector */}
          <NetworkSelector
            options={availableNetworks}
            defaultSelected={selectedNetwork}
            onSelect={setSelectedNetwork}
          />
        </div>

        {/* Snapshot Options Table */}
        <SnapshotTable snapshots={snapshots} />

        {/* Rich Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Start Guide */}
          <div className="lg:col-span-2">
            <InfoCard title="Quick Start Guide">
              <p className="text-muted-foreground mb-4">
                Follow these steps to quickly set up your node with our
                snapshots:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    1. Download Snapshot
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.download}
                    title="Download latest snapshot"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    2. Stop Your Node
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.stop}
                    title="Stop the node service"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    3. Backup Current Data
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.backup}
                    title="Backup existing data"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    4. Extract & Restore
                  </h4>
                  <CodeBlock
                    code={`${quickStartCommands.extract}\n${quickStartCommands.restore}`}
                    title="Extract and restore snapshot"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    5. Start Your Node
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.start}
                    title="Start the node service"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    6. Verify Sync Status
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.verify}
                    title="Check node sync status"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    7. Cleanup (Optional)
                  </h4>
                  <CodeBlock
                    code={quickStartCommands.cleanup}
                    title="Remove downloaded files"
                  />
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Chain Information */}
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
                    <span
                      key={index}
                      className="bg-slate-100 text-xs px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              }
            />
            <InfoRow
              label="GitHub Repository"
              value={
                <a
                  href={chain.binary.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 underline"
                >
                  View Repository
                </a>
              }
            />
            {chain.website && (
              <InfoRow
                label="Official Website"
                value={
                  <a
                    href={chain.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Visit Website
                  </a>
                }
              />
            )}
            {chain.docs && (
              <InfoRow
                label="Documentation"
                value={
                  <a
                    href={chain.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Read Docs
                  </a>
                }
              />
            )}
          </InfoCard>

          {/* Hardware Requirements */}
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

          {/* Sync Instructions */}
          <InfoCard title="Sync Instructions">
            <div className="space-y-4">
              <div>
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
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Snapshot Sync
                </h4>
                <p className="text-sm text-muted-foreground">
                  Use our pre-built snapshots for quick bootstrap.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Full Sync
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sync from genesis (takes several days).
                </p>
              </div>
            </div>
          </InfoCard>

          {/* Network Information */}
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

          {/* Troubleshooting */}
          <InfoCard title="Troubleshooting">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Common Issues
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    • <strong>Snapshot corruption:</strong> Re-download and
                    verify checksums
                  </li>
                  <li>
                    • <strong>Permission errors:</strong> Ensure correct file
                    ownership
                  </li>
                  <li>
                    • <strong>Disk space:</strong> Ensure adequate free space
                    before extraction
                  </li>
                  <li>
                    • <strong>Network timeouts:</strong> Use a reliable internet
                    connection
                  </li>
                  <li>
                    • <strong>Binary mismatch:</strong> Ensure you're using
                    {chain.binary.version}
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Support Resources
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • BryanLabs Discord: Get community support
                  </p>
                  {chain.docs && (
                    <p className="text-sm text-muted-foreground">
                      •{" "}
                      <a
                        href={chain.docs}
                        className="text-accent hover:text-accent/80 underline"
                      >
                        Official Documentation
                      </a>
                    </p>
                  )}
                  {chain.github && (
                    <p className="text-sm text-muted-foreground">
                      •{" "}
                      <a
                        href={chain.github}
                        className="text-accent hover:text-accent/80 underline"
                      >
                        GitHub Issues
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
