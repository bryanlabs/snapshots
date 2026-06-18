import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Clock, Download, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHeight(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return "latest";
  const height = Number(value);
  if (!Number.isFinite(height) || height === 0) return "latest";
  return height.toLocaleString();
}

function customSnapshotTitle(status: string) {
  switch (status) {
    case "completed":
      return "Custom snapshot ready";
    case "failed":
      return "Custom snapshot failed";
    case "processing":
      return "Custom snapshot processing";
    case "retrying":
      return "Custom snapshot retrying";
    default:
      return "Custom snapshot requested";
  }
}

async function RecentActivityWidget({ userId }: { userId: string }) {
  const [recentDownloads, customRequests] = await Promise.all([
    prisma.download.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        snapshot: {
          select: {
            chainId: true,
            fileName: true,
          },
        },
      },
    }),
    prisma.snapshotRequest.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        chainId: true,
        blockHeight: true,
        databaseBackend: true,
        compressionType: true,
        status: true,
        visibility: true,
        progressPhase: true,
        progressMessage: true,
        resultFileName: true,
        resultHeight: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        progressUpdatedAt: true,
      },
    }),
  ]);

  const items = [
    ...recentDownloads.map((download) => ({
      id: `download-${download.id}`,
      type: "download" as const,
      title: "Snapshot download",
      subtitle: download.snapshot?.chainId || "Unknown chain",
      detail: download.snapshot?.fileName || "Snapshot file",
      status: download.status,
      href: download.snapshot?.chainId ? `/chains/${download.snapshot.chainId}` : null,
      timestamp: download.completedAt || download.startedAt || download.queuedAt || download.createdAt,
    })),
    ...customRequests.map((request) => {
      const timestamp = request.completedAt || request.progressUpdatedAt || request.updatedAt || request.createdAt;
      const progress = request.progressPhase?.replace(/_/g, " ");
      const requestedHeight = formatHeight(request.blockHeight);
      const resultHeight = request.resultHeight ? `result ${formatHeight(request.resultHeight)}` : null;

      return {
        id: `custom-${request.id}`,
        type: "custom" as const,
        title: customSnapshotTitle(request.status),
        subtitle: `${request.chainId} at ${requestedHeight}`,
        detail: [
          resultHeight,
          request.databaseBackend,
          request.compressionType,
          request.visibility,
          progress,
          request.progressMessage,
          request.resultFileName,
        ].filter(Boolean).join(" · "),
        status: request.status,
        href: request.resultFileName ? `/chains/${request.chainId}` : null,
        timestamp,
      };
    }),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest downloads and custom snapshot requests</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-blue-500/10 p-2 text-blue-500">
                    {item.type === "download" ? <Download className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant={item.status === "completed" ? "default" : "outline"} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                  {item.href && (
                    <Link href={item.href} className="text-sm font-medium text-blue-500 hover:text-blue-400">
                      Open snapshot page
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Downloads and custom snapshot requests will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const displayName = session.user.email || session.user.walletAddress || session.user.name || "snapshot user";

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4 text-blue-500" />
            Welcome back, {displayName}
          </p>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {session.user.tier || "free"} account
        </Badge>
      </div>

      <RecentActivityWidget userId={session.user.id} />
    </div>
  );
}
