'use client';

export function ActiveConnections() {
  // Mock data for demonstration
  const connections = [
    { id: '1', chain: 'cosmos', user: 'anonymous', tier: 'free', speed: '12.5 MB/s', duration: '2m 15s' },
    { id: '2', chain: 'osmosis', user: 'premium_user', tier: 'premium', speed: '125 MB/s', duration: '45s' },
    { id: '3', chain: 'juno', user: 'anonymous', tier: 'free', speed: '10.2 MB/s', duration: '5m 30s' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Active Connections
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chain
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {connections.map((conn) => (
              <tr key={conn.id}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {conn.chain}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {conn.user}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      conn.tier === 'premium'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {conn.tier}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {conn.speed}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {conn.duration}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}