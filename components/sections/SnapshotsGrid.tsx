import { SnapshotCard, ChainSnapshot } from "../ui/SnapshotCard";
import { getAllChainSnapshots } from "@/lib/data/chains";

interface SnapshotsGridProps {
  searchQuery: string;
}

export const SnapshotsGrid = ({ searchQuery }: SnapshotsGridProps) => {
  const chains: ChainSnapshot[] = getAllChainSnapshots();

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
