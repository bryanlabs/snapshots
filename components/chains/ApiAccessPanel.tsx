'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiAccessPanelProps {
  chainId: string;
}

export function ApiAccessPanel({ chainId }: ApiAccessPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const apiBase = useMemo(() => `/api/v1/chains/${chainId}/snapshots/latest`, [chainId]);
  const examples = [
    {
      key: 'latest',
      label: 'Latest snapshot',
      value: `curl -fsS "https://snapshots.bryanlabs.net${apiBase}" | jq .`,
    },
    {
      key: 'leveldb',
      label: 'LevelDB with previous',
      value: `curl -fsS "https://snapshots.bryanlabs.net${apiBase}?database=leveldb&include_previous=true" | jq .`,
    },
    {
      key: 'pebbledb',
      label: 'PebbleDB with previous',
      value: `curl -fsS "https://snapshots.bryanlabs.net${apiBase}?database=pebbledb&include_previous=true" | jq .`,
    },
  ];

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Terminal className="h-5 w-5 text-blue-500" />
            API and CLI access
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate signed latest URLs for scripts, including database-specific results and previous candidates.
          </p>
        </div>
        <code className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {apiBase}
        </code>
      </div>

      <div className="space-y-3">
        {examples.map((example) => (
          <div key={example.key} className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{example.label}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copy(example.key, example.value)}
                className="h-8"
              >
                {copied === example.key ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied === example.key ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <code className="block overflow-x-auto whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
              {example.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
