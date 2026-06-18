'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy, Download, Terminal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Snapshot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DownloadUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  expiresAt?: string | null;
  snapshot: Snapshot | null;
}

export function DownloadUrlDialog({ isOpen, onClose, downloadUrl, expiresAt, snapshot }: DownloadUrlDialogProps) {
  const [copied, setCopied] = useState<'url' | 'curl' | 'aria2' | null>(null);

  const commands = useMemo(() => {
    if (!downloadUrl) {
      return {
        curl: '',
        aria2: '',
      };
    }

    return {
      curl: `curl -L -C - -O "${downloadUrl}"`,
      aria2: `aria2c -c -x 8 -s 8 -k 1M --file-allocation=none "${downloadUrl}"`,
    };
  }, [downloadUrl]);

  const copyValue = async (key: 'url' | 'curl' | 'aria2', value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Download Ready</DialogTitle>
          <DialogDescription className="mt-1">
            {snapshot ? snapshot.fileName : 'Snapshot URL generated'}
          </DialogDescription>
        </DialogHeader>

        {snapshot && (
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Height</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">{snapshot.height.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Database</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">{snapshot.databaseLabel || snapshot.databaseBackend || 'Default'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Signed URL</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}` : 'Temporary'}
              </dd>
            </div>
          </dl>
        )}

        <div className="space-y-3">
          <CommandRow
            label="Signed URL"
            value={downloadUrl}
            copied={copied === 'url'}
            onCopy={() => copyValue('url', downloadUrl)}
          />
          <CommandRow
            label="curl"
            value={commands.curl}
            copied={copied === 'curl'}
            onCopy={() => copyValue('curl', commands.curl)}
            icon={<Terminal className="h-4 w-4" />}
          />
          <CommandRow
            label="aria2c"
            value={commands.aria2}
            copied={copied === 'aria2'}
            onCopy={() => copyValue('aria2', commands.aria2)}
            icon={<Terminal className="h-4 w-4" />}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Open Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CommandRowProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  icon?: ReactNode;
}

function CommandRow({ label, value, copied, onCopy, icon }: CommandRowProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          {icon}
          {label}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            copied
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className="block max-h-24 overflow-auto break-all rounded-md bg-gray-50 p-2 text-xs text-gray-700 dark:bg-gray-950 dark:text-gray-300">
        {value}
      </code>
    </div>
  );
}
