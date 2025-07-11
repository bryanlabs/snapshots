interface AdminStatsProps {
  stats: {
    activeConnections: number;
    connectionsByTier: {
      free: number;
      premium: number;
    };
    totalBandwidthUsage: string;
    userCount: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: 'Active Downloads',
      value: stats.activeConnections,
      icon: '📥',
      description: 'Current active connections',
    },
    {
      title: 'Free Tier Users',
      value: stats.connectionsByTier.free,
      icon: '👥',
      description: 'Active free tier downloads',
    },
    {
      title: 'Premium Users',
      value: stats.connectionsByTier.premium,
      icon: '⭐',
      description: 'Active premium downloads',
    },
    {
      title: 'Total Bandwidth',
      value: stats.totalBandwidthUsage,
      icon: '📊',
      description: 'Total bandwidth consumed',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {stat.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}