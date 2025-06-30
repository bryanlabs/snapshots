import { DownloadIcon, ViewIcon } from "../icons";
import { ChainIcon } from "./ChainIcon";

export interface ChainSnapshot {
  name: string;
  network: string;
  latestBlock: number;
  size: string;
  prunedSize: string;
  updated: string;
}

interface SnapshotCardProps {
  chain: ChainSnapshot;
}

export const SnapshotCard = ({ chain }: SnapshotCardProps) => (
  <div className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
    <div className="flex items-start gap-4 mb-4">
      <ChainIcon name={chain.name} />
      <div className="flex-1">
        <h3 className="text-xl font-bold text-foreground mb-1">{chain.name}</h3>
        <p className="text-sm text-muted-foreground">{chain.network}</p>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Latest Block:</span>
        <span className="font-mono text-sm font-medium text-foreground">
          #{chain.latestBlock.toLocaleString()}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Size:</span>
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {chain.size}
          </div>
          <div className="text-xs text-muted-foreground">
            pruned: {chain.prunedSize}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Updated:</span>
        <span className="text-sm font-medium text-foreground">
          {chain.updated}
        </span>
      </div>
    </div>

    <div className="flex gap-3">
      <button className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
        <DownloadIcon />
        Download
      </button>
      <button className="bg-slate-100 hover:bg-slate-200 text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
        <ViewIcon />
        Details
      </button>
    </div>
  </div>
);
