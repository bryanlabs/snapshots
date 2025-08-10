'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface VitalsSummary {
  url: string;
  count: number;
  summary: Record<string, MetricSummary>;
}

interface MetricSummary {
  count: number;
  average: number;
  median: number;
  p75: number;
  p95: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

const METRIC_INFO = {
  CLS: {
    name: 'Cumulative Layout Shift',
    unit: '',
    thresholds: { good: 0.1, poor: 0.25 },
    description: 'Measures visual stability',
  },
  FCP: {
    name: 'First Contentful Paint',
    unit: 'ms',
    thresholds: { good: 1800, poor: 3000 },
    description: 'Time to first content render',
  },
  INP: {
    name: 'Interaction to Next Paint',
    unit: 'ms',
    thresholds: { good: 200, poor: 500 },
    description: 'Responsiveness to user interactions',
  },
  LCP: {
    name: 'Largest Contentful Paint',
    unit: 'ms',
    thresholds: { good: 2500, poor: 4000 },
    description: 'Time to largest content render',
  },
  TTFB: {
    name: 'Time to First Byte',
    unit: 'ms',
    thresholds: { good: 800, poor: 1800 },
    description: 'Server response time',
  },
};

export function WebVitalsDashboard() {
  const [data, setData] = useState<VitalsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vitals');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchVitals, 30000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (metric: string, value: number) => {
    const info = METRIC_INFO[metric as keyof typeof METRIC_INFO];
    if (!info) return 'text-gray-500';
    
    if (value <= info.thresholds.good) return 'text-green-500';
    if (value <= info.thresholds.poor) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatValue = (metric: string, value: number) => {
    const info = METRIC_INFO[metric as keyof typeof METRIC_INFO];
    if (metric === 'CLS') return value.toFixed(3);
    return `${Math.round(value)}${info?.unit || ''}`;
  };

  const getPerformanceScore = (summary: MetricSummary) => {
    const total = summary.good + summary.needsImprovement + summary.poor;
    if (total === 0) return 0;
    return Math.round((summary.good / total) * 100);
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading vitals data...</div>
      </div>
    );
  }

  const selectedData = selectedUrl 
    ? data.find(d => d.url === selectedUrl)
    : null;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchVitals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* URL List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Monitored Pages
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No vitals data collected yet. Visit some pages to start collecting metrics.
            </div>
          ) : (
            data.map((item) => (
              <button
                key={item.url}
                onClick={() => setSelectedUrl(item.url)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedUrl === item.url ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.url}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.count} measurements
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {Object.entries(item.summary).map(([metric, summary]) => (
                      <div key={metric} className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {metric}
                        </div>
                        <div className={`text-sm font-medium ${getScoreColor(metric, summary.median)}`}>
                          {formatValue(metric, summary.median)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getPerformanceScore(summary)}% good
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {selectedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(selectedData.summary).map(([metric, summary]) => {
            const info = METRIC_INFO[metric as keyof typeof METRIC_INFO];
            if (!info) return null;

            const score = getPerformanceScore(summary);
            
            return (
              <div key={metric} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {info.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {info.description}
                  </p>
                </div>

                {/* Performance Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Performance Score
                    </span>
                    <span className={`text-2xl font-bold ${
                      score >= 90 ? 'text-green-500' : 
                      score >= 50 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        score >= 90 ? 'bg-green-500' : 
                        score >= 50 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Median</span>
                    <span className={`font-medium ${getScoreColor(metric, summary.median)}`}>
                      {formatValue(metric, summary.median)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">75th Percentile</span>
                    <span className={`font-medium ${getScoreColor(metric, summary.p75)}`}>
                      {formatValue(metric, summary.p75)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">95th Percentile</span>
                    <span className={`font-medium ${getScoreColor(metric, summary.p95)}`}>
                      {formatValue(metric, summary.p95)}
                    </span>
                  </div>
                </div>

                {/* Distribution */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      Good: {summary.good}
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      Needs Work: {summary.needsImprovement}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      Poor: {summary.poor}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}