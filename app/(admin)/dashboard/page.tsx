import { getStats } from '@/lib/bandwidth/stats';
import { AdminStats } from '@/components/admin/AdminStats';
import { BandwidthChart } from '@/components/admin/BandwidthChart';
import { ActiveConnections } from '@/components/admin/ActiveConnections';

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor bandwidth usage, active connections, and system health.
        </p>
      </div>

      {/* Quick stats */}
      <AdminStats stats={stats} />

      {/* Bandwidth usage chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BandwidthChart />
        <ActiveConnections />
      </div>

      {/* Recent downloads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Downloads
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Download history will be displayed here once implemented.
        </p>
      </div>
    </div>
  );
}