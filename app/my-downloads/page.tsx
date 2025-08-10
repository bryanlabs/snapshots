import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MyDownloadsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Handle premium user specially
  if (session.user.id === 'premium-user') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Downloads</h1>
          <p className="text-muted-foreground">View your download history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Premium Account</CardTitle>
            <CardDescription>
              Download history is not tracked for premium accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a premium user, you have unlimited access to all snapshots.
              Visit the <Link href="/chains" className="text-blue-600 hover:underline">chains page</Link> to browse and download snapshots.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloads = await prisma.download.findMany({
    where: { userId: session.user.id },
    include: {
      snapshot: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Downloads</h1>
        <p className="text-muted-foreground">View your download history</p>
      </div>

      {downloads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't downloaded any snapshots yet.</p>
            <Button asChild>
              <Link href="/">Browse Snapshots</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {downloads.map((download) => (
            <Card key={download.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {download.snapshot?.fileName || 'Unknown File'}
                    </CardTitle>
                    <CardDescription>
                      {download.snapshot?.chainId || 'Unknown Chain'} • 
                      {formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      download.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : download.status === 'active'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : download.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {download.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">File Size</p>
                    <p className="font-medium">
                      {(download.fileSizeBytes / (1024 ** 3)).toFixed(2)} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Downloaded</p>
                    <p className="font-medium">
                      {(download.bytesTransferred / (1024 ** 3)).toFixed(2)} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Speed</p>
                    <p className="font-medium">
                      {download.actualBandwidthMbps?.toFixed(1) || download.allocatedBandwidthMbps} Mbps
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credits Used</p>
                    <p className="font-medium">
                      {download.creditsUsed || 1}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}