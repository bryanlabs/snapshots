'use client';

export function BandwidthChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Bandwidth Usage (24h)
      </h2>
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Chart visualization would go here</p>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
        To implement: Integrate with a charting library like Chart.js or Recharts
      </p>
    </div>
  );
}