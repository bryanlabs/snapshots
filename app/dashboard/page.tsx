import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Suspense } from "react";
import { 
  Download, 
  TrendingUp, 
  Zap, 
  Clock, 
  Activity, 
  Globe, 
  Users, 
  Star,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Timer,
  CreditCard
} from "lucide-react";

// Helper Components
function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  change,
  changeType = "neutral",
  colorScheme = "default" 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  colorScheme?: "default" | "success" | "warning" | "danger" | "premium";
}) {
  const colorClasses = {
    default: "from-blue-500/10 to-blue-600/5 border-blue-200/20",
    success: "from-green-500/10 to-green-600/5 border-green-200/20",
    warning: "from-yellow-500/10 to-yellow-600/5 border-yellow-200/20",
    danger: "from-red-500/10 to-red-600/5 border-red-200/20",
    premium: "from-purple-500/10 to-purple-600/5 border-purple-200/20"
  };

  const iconColorClasses = {
    default: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    premium: "text-purple-600"
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[colorScheme]} backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColorClasses[colorScheme]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {change && (
            <div className={`flex items-center gap-1 ${
              changeType === "positive" ? "text-green-600" : 
              changeType === "negative" ? "text-red-600" : 
              "text-muted-foreground"
            }`}>
              {changeType === "positive" && <ArrowUp className="h-3 w-3" />}
              {changeType === "negative" && <ArrowDown className="h-3 w-3" />}
              {changeType === "neutral" && <Minus className="h-3 w-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  badge,
  variant = "outline" 
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  badge?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <Card className="group hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4">
        <Link href={href} className="block">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

function PopularChainsWidget() {
  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Popular Chains
        </CardTitle>
        <CardDescription>Most downloaded this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { name: "Osmosis", downloads: "1.2k", change: "+15%" },
          { name: "Cosmos Hub", downloads: "890", change: "+8%" },
          { name: "Juno", downloads: "567", change: "+22%" },
          { name: "Stargaze", downloads: "445", change: "+5%" }
        ].map((chain, i) => (
          <div key={chain.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {chain.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{chain.name}</p>
                <p className="text-xs text-muted-foreground">{chain.downloads} downloads</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs text-green-600">
              {chain.change}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SystemStatusWidget() {
  const services = [
    { name: "API", status: "operational", latency: "45ms" },
    { name: "Downloads", status: "operational", latency: "120ms" },
    { name: "Database", status: "operational", latency: "15ms" },
  ];

  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          System Status
        </CardTitle>
        <CardDescription>All systems operational</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">{service.name}</span>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                {service.latency}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

async function RecentActivityWidget({ userId }: { userId: string }) {
  // Get recent downloads for the user
  const recentDownloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      snapshot: {
        select: {
          chainId: true,
          fileName: true,
        }
      }
    }
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest downloads and activity</CardDescription>
      </CardHeader>
      <CardContent>
        {recentDownloads.length > 0 ? (
          <div className="space-y-3">
            {recentDownloads.map((download) => (
              <div key={download.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {download.snapshot?.chainId || 'Unknown Chain'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {download.snapshot?.fileName || 'Snapshot download'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={
                      download.status === 'completed' ? 'default' : 
                      download.status === 'active' ? 'secondary' : 
                      'outline'
                    }
                    className="text-xs"
                  >
                    {download.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(download.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent downloads</p>
            <p className="text-xs">Your download history will appear here</p>
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

  // Handle premium user specially
  if (session.user.id === 'premium-user') {
    const stats = {
      completed: 0,
      active: 0,
      queued: 0,
    };
    
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Welcome back, {session.user.email || session.user.walletAddress}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All systems operational
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Tier"
            value="Premium"
            description="Unlimited bandwidth"
            icon={Star}
            colorScheme="premium"
            change="Unlimited access"
            changeType="positive"
          />
          
          <StatCard
            title="Credit Balance"
            value="∞"
            description="Premium account"
            icon={CreditCard}
            colorScheme="success"
            change="No limits"
            changeType="positive"
          />
          
          <StatCard
            title="Downloads"
            value={stats.completed}
            description={`${stats.active} active, ${stats.queued} queued`}
            icon={Download}
            colorScheme="default"
            change="Ready to download"
            changeType="neutral"
          />
          
          <StatCard
            title="Download Speed"
            value="Max"
            description="Priority bandwidth"
            icon={Zap}
            colorScheme="warning"
            change="No throttling"
            changeType="positive"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <QuickActionCard
                title="Browse Snapshots"
                description="Explore all available chains"
                href="/"
                icon={Globe}
                badge="50+ chains"
              />
              <QuickActionCard
                title="Download History"
                description="View your downloads"
                href="/my-downloads"
                icon={Clock}
              />
              <QuickActionCard
                title="Account Settings"
                description="Manage your profile"
                href="/account"
                icon={Users}
              />
            </div>
          </div>

          {/* Popular Chains */}
          <PopularChainsWidget />

          {/* System Status */}
          <SystemStatusWidget />
        </div>

        {/* Recent Activity */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <RecentActivityWidget userId={session.user.id} />
        </Suspense>
      </div>
    );
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
    session.user.tierId 
      ? prisma.tier.findUnique({
          where: { id: session.user.tierId },
        })
      : null,
  ]);

  const stats = {
    completed: downloadStats.find((s) => s.status === "completed")?._count.id || 0,
    active: downloadStats.find((s) => s.status === "active")?._count.id || 0,
    queued: downloadStats.find((s) => s.status === "queued")?._count.id || 0,
  };

  // Calculate progress percentage for tier
  const dailyDownloadUsage = Math.min((stats.completed / (tier?.dailyDownloadGb || 1)) * 100, 100);
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Welcome back, {session.user.email || session.user.walletAddress}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`${
              tier?.name === 'free' ? 'text-blue-600 border-blue-200' : 
              tier?.name === 'premium' ? 'text-purple-600 border-purple-200' : 
              'text-gray-600 border-gray-200'
            }`}
          >
            {tier?.displayName || "Free"}
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Tier"
          value={tier?.displayName || "Free"}
          description={`${tier?.bandwidthMbps || 50} Mbps bandwidth`}
          icon={tier?.name === 'premium' ? Star : Zap}
          colorScheme={tier?.name === 'premium' ? 'premium' : 'default'}
          change={tier?.name === 'free' ? 'Upgrade available' : 'Active'}
          changeType={tier?.name === 'free' ? 'neutral' : 'positive'}
        />
        
        <StatCard
          title="Credit Balance"
          value={`$${((creditBalance?.creditBalance || 0) / 100).toFixed(2)}`}
          description="Available credits"
          icon={CreditCard}
          colorScheme={creditBalance?.creditBalance && creditBalance.creditBalance > 0 ? 'success' : 'warning'}
          change={creditBalance?.creditBalance && creditBalance.creditBalance > 1000 ? 'Well funded' : 'Consider adding funds'}
          changeType={creditBalance?.creditBalance && creditBalance.creditBalance > 1000 ? 'positive' : 'neutral'}
        />
        
        <StatCard
          title="Downloads"
          value={stats.completed}
          description={`${stats.active} active, ${stats.queued} queued`}
          icon={Download}
          colorScheme="default"
          change={stats.completed > 0 ? `${stats.completed} completed` : 'Start downloading'}
          changeType={stats.completed > 0 ? 'positive' : 'neutral'}
        />
        
        <StatCard
          title="Daily Limit"
          value={session.user.tier === 'free' ? '5' : 'Unlimited'}
          description={session.user.tier === 'free' ? `${Math.round(dailyDownloadUsage)}% used` : 'No limits'}
          icon={Timer}
          colorScheme={
            session.user.tier === 'free' 
              ? dailyDownloadUsage > 80 ? 'danger' : dailyDownloadUsage > 50 ? 'warning' : 'success'
              : 'success'
          }
          change={session.user.tier === 'free' ? 'Daily refresh' : 'No throttling'}
          changeType={session.user.tier === 'free' ? 'neutral' : 'positive'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickActionCard
              title="Browse Snapshots"
              description="Explore available chains"
              href="/"
              icon={Globe}
              badge="50+ chains"
            />
            <QuickActionCard
              title="Download History"
              description="View your downloads"
              href="/my-downloads"
              icon={Clock}
              badge={stats.completed > 0 ? `${stats.completed} downloads` : undefined}
            />
            {tier?.canCreateTeams && (
              <QuickActionCard
                title="Manage Teams"
                description="Team collaboration"
                href="/teams"
                icon={Users}
                badge="Teams enabled"
              />
            )}
            {tier?.canRequestSnapshots && (
              <QuickActionCard
                title="Custom Snapshots"
                description="Request specific snapshots"
                href="/requests"
                icon={Star}
                badge="Premium feature"
              />
            )}
          </div>
        </div>

        {/* Popular Chains */}
        <PopularChainsWidget />

        {/* Enhanced Tier Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Your Plan Features
            </CardTitle>
            <CardDescription>
              {tier?.name === 'free' ? 'Free tier benefits' : 'Premium benefits'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tier?.features ? (
              <div className="space-y-2">
                {JSON.parse(tier.features).map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Basic snapshot access</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Standard bandwidth</span>
                </div>
              </div>
            )}
            
            {tier?.name === 'free' && (
              <div className="pt-3 border-t">
                <Link href="/billing">
                  <Button size="sm" className="w-full">
                    <Star className="h-4 w-4 mr-1" />
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <RecentActivityWidget userId={session.user.id} />
      </Suspense>
    </div>
  );
}