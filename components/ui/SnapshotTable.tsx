import { PolkachuSnapshotsResponse } from "@/lib/hooks";
import { DownloadIcon } from "../icons";

interface SnapshotTableProps {
  snapshotData: PolkachuSnapshotsResponse;
}

export const SnapshotTable = ({ snapshotData }: SnapshotTableProps) => (
  <div className="bg-white rounded-xl border border-border overflow-hidden mb-12">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Time
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
          <tr className="border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors">
            <td className="py-4 px-6">
              <div>
                <div className="font-medium text-foreground">
                  {snapshotData.snapshot.time}
                </div>
              </div>
            </td>
            <td className="py-4 px-6">
              <span className="font-mono text-foreground">
                #{snapshotData.snapshot.block_height}
              </span>
            </td>
            <td className="py-4 px-6">
              <span className="font-medium text-foreground">
                {snapshotData.snapshot.size}
              </span>
            </td>
            <td className="py-4 px-6">
              <span className="text-muted-foreground">
                {snapshotData.snapshot.time}
              </span>
            </td>
            <td className="py-4 px-6">
              <a
                className="bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center"
                href={snapshotData.snapshot.url}
              >
                <DownloadIcon />
                Download
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);
