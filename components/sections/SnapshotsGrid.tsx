import { SnapshotCard, ChainSnapshot } from "../ui/SnapshotCard";

interface SnapshotsGridProps {
  searchQuery: string;
}

export const SnapshotsGrid = ({ searchQuery }: SnapshotsGridProps) => {
  const chains: ChainSnapshot[] = [
    {
      name: "CosmosHub",
      network: "cosmos-4",
      latestBlock: 18234567,
      size: "145 GB",
      prunedSize: "23 GB",
      updated: "2 hours ago",
    },
    {
      name: "Osmosis",
      network: "osmosis-1",
      latestBlock: 12345678,
      size: "89 GB",
      prunedSize: "15 GB",
      updated: "4 hours ago",
    },
    {
      name: "Juno",
      network: "juno-1",
      latestBlock: 9876543,
      size: "67 GB",
      prunedSize: "11 GB",
      updated: "1 hour ago",
    },
    {
      name: "Stargaze",
      network: "stargaze-1",
      latestBlock: 7654321,
      size: "45 GB",
      prunedSize: "8 GB",
      updated: "3 hours ago",
    },
    {
      name: "Akash",
      network: "akashnet-2",
      latestBlock: 11234567,
      size: "78 GB",
      prunedSize: "13 GB",
      updated: "5 hours ago",
    },
    {
      name: "Persistence",
      network: "core-1",
      latestBlock: 8765432,
      size: "52 GB",
      prunedSize: "9 GB",
      updated: "6 hours ago",
    },
  ];

  const filteredChains = chains.filter(
    (chain) =>
      chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredChains.map((chain, index) => (
        <SnapshotCard key={index} chain={chain} />
      ))}
    </div>
  );
};
