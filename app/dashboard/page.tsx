import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user's download stats
  const [downloadStats, creditBalance, tier] = await Promise.all([
    prisma.download.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditBalance: true },
    }),
    prisma.tier.findUnique({
      where: { id: session.user.tierId || undefined },
    }),
  ]);

  const stats = {
    completed: downloadStats.find((s) => s.status === "completed")?._count.id || 0,
    active: downloadStats.find((s) => s.status === "active")?._count.id || 0,
    queued: downloadStats.find((s) => s.status === "queued")?._count.id || 0,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.email || session.user.walletAddress}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tier?.displayName || "Free"}</div>
            <p className="text-xs text-muted-foreground">
              {tier?.bandwidthMbps} Mbps bandwidth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((creditBalance?.creditBalance || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Available credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active > 0 && `${stats.active} active, `}
              {stats.queued > 0 && `${stats.queued} queued`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Download Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {session.user.tier === 'free' ? '5' : 'Unlimited'}
            </div>
            <p className="text-xs text-muted-foreground">
              {session.user.tier === 'free' ? 'Daily refresh' : 'No limit'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and navigation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="/">Browse Snapshots</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/my-downloads">View Downloads</Link>
            </Button>
            {tier?.canCreateTeams && (
              <Button asChild className="w-full" variant="outline">
                <Link href="/teams">Manage Teams</Link>
              </Button>
            )}
            {tier?.canRequestSnapshots && (
              <Button asChild className="w-full" variant="outline">
                <Link href="/requests">Snapshot Requests</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tier Features</CardTitle>
            <CardDescription>Your current plan includes</CardDescription>
          </CardHeader>
          <CardContent>
            {tier?.features && (
              <ul className="space-y-2 text-sm">
                {JSON.parse(tier.features).map((feature: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}