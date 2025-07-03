import { DownloadIcon } from "../icons";

export interface SnapshotOption {
  type: string;
  blockHeight: number;
  size: string;
  lastUpdated: string;
  description?: string;
}

interface SnapshotTableProps {
  snapshots: SnapshotOption[];
}

export const SnapshotTable = ({ snapshots }: SnapshotTableProps) => (
  <div className="bg-white rounded-xl border border-border overflow-hidden mb-12">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Type
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Block Height
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Size
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Last Updated
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((snapshot, index) => (
            <tr
              key={index}
              className="border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <td className="py-4 px-6">
                <div>
                  <div className="font-medium text-foreground">
                    {snapshot.type}
                  </div>
                  {snapshot.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {snapshot.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="font-mono text-foreground">
                  #{snapshot.blockHeight.toLocaleString()}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="font-medium text-foreground">
                  {snapshot.size}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="text-muted-foreground">
                  {snapshot.lastUpdated}
                </span>
              </td>
              <td className="py-4 px-6">
                <button className="bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
                  <DownloadIcon />
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
