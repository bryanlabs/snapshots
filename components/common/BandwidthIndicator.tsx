'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface BandwidthStats {
  tier: 'free' | 'premium';
  currentSpeed: number;
  maxSpeed: number;
  activeConnections: number;
}

export function BandwidthIndicator() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BandwidthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/bandwidth/status');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch bandwidth stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  if (isLoading || !stats) {
    return null;
  }

  const tier = user ? 'premium' : 'free';
  const tierLimits = {
    free: { speed: 50, color: 'blue' },
    premium: { speed: 250, color: 'purple' }
  };

  const { speed: maxSpeed, color } = tierLimits[tier];
  const speedPercentage = (stats.currentSpeed / maxSpeed) * 100;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="space-y-3">
        {/* Tier badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Bandwidth Tier
          </span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              tier === 'premium'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
          >
            {tier.toUpperCase()}
          </span>
        </div>

        {/* Speed indicator */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Speed
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.currentSpeed.toFixed(1)} MB/s
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                speedPercentage > 90
                  ? 'bg-red-500'
                  : speedPercentage > 70
                  ? 'bg-yellow-500'
                  : `bg-${color}-500`
              }`}
              style={{ width: `${Math.min(speedPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              0 MB/s
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {maxSpeed} MB/s (shared)
            </span>
          </div>
        </div>

        {/* Active connections */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active {tier} users
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {stats.activeConnections}
          </span>
        </div>

        {/* Upgrade prompt for free users */}
        {tier === 'free' && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/login"
              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Upgrade to Premium for 5x speed →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}