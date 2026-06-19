'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Clipboard, Play, Terminal } from 'lucide-react';

type HttpMethod = 'GET' | 'POST';
type ParameterKind = 'path' | 'query' | 'body';

interface ApiParameter {
  name: string;
  kind: ParameterKind;
  description: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface ApiOperation {
  id: string;
  group: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  parameters: ApiParameter[];
  sampleResponse: string;
}

interface OperationResult {
  status: number | null;
  durationMs: number | null;
  body: string;
  error?: string;
}

const methodStyles: Record<HttpMethod, string> = {
  GET: 'border-blue-400 bg-blue-500 text-blue-950',
  POST: 'border-emerald-400 bg-emerald-500 text-emerald-950',
};

const operations: ApiOperation[] = [
  {
    id: 'health',
    group: 'Operations',
    method: 'GET',
    path: '/api/health',
    summary: 'Health probe',
    description: 'Checks webapp health and backing storage reachability.',
    parameters: [],
    sampleResponse: `{
  "status": "healthy",
  "timestamp": "2026-06-19T12:00:00.000Z"
}`,
  },
  {
    id: 'chains',
    group: 'Catalog',
    method: 'GET',
    path: '/api/v1/chains',
    summary: 'List chains',
    description: 'Returns public chains with snapshot counts and latest snapshot metadata.',
    parameters: [],
    sampleResponse: `{
  "success": true,
  "data": [
    {
      "id": "cosmoshub-4",
      "name": "Cosmos Hub",
      "snapshotCount": 4
    }
  ]
}`,
  },
  {
    id: 'chain',
    group: 'Catalog',
    method: 'GET',
    path: '/api/v1/chains/{chainId}',
    summary: 'Chain detail',
    description: 'Returns display metadata, latest snapshot summary, and total published bytes for one canonical chain.',
    parameters: [
      { name: 'chainId', kind: 'path', required: true, description: 'Canonical chain id.', defaultValue: 'cosmoshub-4' },
    ],
    sampleResponse: `{
  "success": true,
  "data": {
    "id": "cosmoshub-4",
    "name": "Cosmos Hub",
    "snapshotCount": 4,
    "totalSize": 1234567890
  }
}`,
  },
  {
    id: 'chain-info',
    group: 'Catalog',
    method: 'GET',
    path: '/api/v1/chains/{chainId}/info',
    summary: 'Chain metadata',
    description: 'Returns compact metadata for automation, including latest height, average size, and schedule.',
    parameters: [
      { name: 'chainId', kind: 'path', required: true, description: 'Canonical chain id.', defaultValue: 'cosmoshub-4' },
    ],
    sampleResponse: `{
  "success": true,
  "data": {
    "chain_id": "cosmoshub-4",
    "latest_snapshot": {
      "height": 123456,
      "size": 123456789,
      "age_hours": 2
    }
  }
}`,
  },
  {
    id: 'snapshots',
    group: 'Snapshots',
    method: 'GET',
    path: '/api/v1/chains/{chainId}/snapshots',
    summary: 'List snapshots',
    description: 'Lists scheduled snapshots plus custom snapshots visible to the current user.',
    parameters: [
      { name: 'chainId', kind: 'path', required: true, description: 'Canonical chain id.', defaultValue: 'cosmoshub-4' },
    ],
    sampleResponse: `{
  "success": true,
  "data": [
    {
      "id": "cosmoshub-4-123456",
      "height": 123456,
      "databaseBackend": "pebbledb",
      "fileName": "cosmoshub-4-123456-20260619-120000.tar.zst"
    }
  ]
}`,
  },
  {
    id: 'latest',
    group: 'Snapshots',
    method: 'GET',
    path: '/api/v1/chains/{chainId}/snapshots/latest',
    summary: 'Latest signed snapshot URL',
    description: 'Generates a short-lived signed URL for the newest scheduled artifact, optionally filtered by database backend.',
    parameters: [
      { name: 'chainId', kind: 'path', required: true, description: 'Canonical chain id.', defaultValue: 'cosmoshub-4' },
      {
        name: 'database',
        kind: 'query',
        description: 'Choose a database backend or let the API choose the latest artifact.',
        defaultValue: 'pebbledb',
        options: [
          { label: 'any', value: 'any' },
          { label: 'goleveldb', value: 'goleveldb' },
          { label: 'pebbledb', value: 'pebbledb' },
        ],
      },
      {
        name: 'include_previous',
        kind: 'query',
        description: 'Include fallback artifacts behind the latest result.',
        defaultValue: 'false',
        options: [
          { label: 'false', value: 'false' },
          { label: 'true', value: 'true' },
        ],
      },
    ],
    sampleResponse: `{
  "success": true,
  "data": {
    "chain_id": "cosmoshub-4",
    "height": 123456,
    "database_backend": "pebbledb",
    "expires_at": "2026-06-19T18:00:00.000Z",
    "commands": {
      "curl": "curl -L -C - -O ..."
    }
  }
}`,
  },
  {
    id: 'download',
    group: 'Downloads',
    method: 'POST',
    path: '/api/v1/chains/{chainId}/download',
    summary: 'Generate download URL by snapshot id',
    description: 'Generates a signed URL for a specific snapshot id after access and rate-limit checks.',
    parameters: [
      { name: 'chainId', kind: 'path', required: true, description: 'Canonical chain id.', defaultValue: 'cosmoshub-4' },
      { name: 'snapshotId', kind: 'body', required: true, description: 'Snapshot id from the snapshot list endpoint.', placeholder: 'cosmoshub-4-123456' },
      { name: 'email', kind: 'body', description: 'Optional email for download logging.', placeholder: 'operator@example.com' },
    ],
    sampleResponse: `{
  "success": true,
  "data": {
    "downloadUrl": "https://snaps.bryanlabs.net/secure/...",
    "expiresAt": "2026-06-19T18:00:00.000Z"
  }
}`,
  },
];

function groupOperations() {
  return operations.reduce<Record<string, ApiOperation[]>>((groups, operation) => {
    groups[operation.group] = groups[operation.group] || [];
    groups[operation.group].push(operation);
    return groups;
  }, {});
}

function CodeBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-400 hover:text-blue-200"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      </button>
      <pre className="overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-4 pr-14 text-sm leading-6 text-slate-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function initialValues(operation: ApiOperation, defaultChainId: string) {
  return operation.parameters.reduce<Record<string, string>>((values, parameter) => {
    values[parameter.name] =
      parameter.defaultValue ||
      (parameter.name === 'chainId' ? defaultChainId : '') ||
      '';
    return values;
  }, {});
}

function buildRequest(operation: ApiOperation, values: Record<string, string>, origin: string) {
  let path = operation.path;
  operation.parameters
    .filter((parameter) => parameter.kind === 'path')
    .forEach((parameter) => {
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(values[parameter.name] || parameter.defaultValue || ''));
    });

  const url = new URL(path, origin);
  operation.parameters
    .filter((parameter) => parameter.kind === 'query')
    .forEach((parameter) => {
      const value = values[parameter.name];
      if (value && value !== 'any') {
        url.searchParams.set(parameter.name, value);
      }
    });

  const bodyParams = operation.parameters.filter((parameter) => parameter.kind === 'body');
  const body = bodyParams.reduce<Record<string, string>>((payload, parameter) => {
    const value = values[parameter.name]?.trim();
    if (value) payload[parameter.name] = value;
    return payload;
  }, {});

  return {
    url,
    body: bodyParams.length > 0 ? body : null,
  };
}

function buildCurl(operation: ApiOperation, values: Record<string, string>, origin: string) {
  const request = buildRequest(operation, values, origin);
  const parts = ['curl', '-fsS'];
  if (operation.method !== 'GET') {
    parts.push('-X', operation.method, '-H', "'Content-Type: application/json'");
  }
  if (request.body && Object.keys(request.body).length > 0) {
    parts.push('-d', `'${JSON.stringify(request.body, null, 2)}'`);
  }
  parts.push(`'${request.url.toString()}'`);
  return `${parts.join(' ')} | jq .`;
}

function ParameterInput({
  parameter,
  value,
  onChange,
}: {
  parameter: ApiParameter;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
      <span>
        <span className="block text-sm font-medium text-slate-100">{parameter.name}</span>
        <span className="font-mono text-xs text-slate-400">{parameter.kind}{parameter.required ? ' required' : ''}</span>
      </span>
      <span>
        <span className="mb-2 block text-sm text-slate-300">{parameter.description}</span>
        {parameter.options ? (
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100"
          >
            {parameter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={parameter.placeholder || parameter.defaultValue}
            className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
        )}
      </span>
    </label>
  );
}

function OperationPanel({
  operation,
  origin,
  defaultChainId,
}: {
  operation: ApiOperation;
  origin: string;
  defaultChainId: string;
}) {
  const [open, setOpen] = useState(operation.id === 'chains');
  const [values, setValues] = useState(() => initialValues(operation, defaultChainId));
  const [result, setResult] = useState<OperationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const curl = useMemo(() => buildCurl(operation, values, origin), [operation, values, origin]);
  const request = useMemo(() => buildRequest(operation, values, origin), [operation, values, origin]);

  async function execute() {
    setIsExecuting(true);
    const started = performance.now();

    try {
      const response = await fetch(request.url.toString(), {
        method: operation.method,
        headers: request.body ? { 'Content-Type': 'application/json' } : undefined,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const text = await response.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        body = text;
      }
      setResult({
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        body,
      });
    } catch (error) {
      setResult({
        status: null,
        durationMs: Math.round(performance.now() - started),
        body: '',
        error: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-blue-500/40 bg-slate-900/70">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-stretch text-left"
      >
        <span className={`flex w-20 shrink-0 items-center justify-center border-r px-3 text-sm font-bold ${methodStyles[operation.method]}`}>
          {operation.method}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
          <span className="font-mono text-base font-bold text-white">{operation.path}</span>
          <span className="hidden text-sm text-slate-300 sm:inline">{operation.summary}</span>
        </span>
        <span className="flex w-12 items-center justify-center text-slate-300">
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="space-y-6 border-t border-blue-500/30 p-5">
          <p className="text-sm text-slate-300">{operation.description}</p>

          {operation.parameters.length > 0 && (
            <div className="space-y-4">
              <h3 className="border-b border-blue-400 pb-2 text-sm font-semibold text-white">Parameters</h3>
              {operation.parameters.map((parameter) => (
                <ParameterInput
                  key={parameter.name}
                  parameter={parameter}
                  value={values[parameter.name] || ''}
                  onChange={(value) => setValues((current) => ({ ...current, [parameter.name]: value }))}
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Request URL</h3>
            <CodeBlock value={request.url.toString()} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">curl</h3>
            <CodeBlock value={curl} />
          </div>

          <button
            type="button"
            onClick={execute}
            disabled={isExecuting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-500 px-4 text-sm font-semibold text-blue-950 hover:bg-blue-400 disabled:cursor-wait disabled:opacity-70"
          >
            <Play className="h-4 w-4" />
            {isExecuting ? 'Executing' : 'Execute'}
          </button>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Response</h3>
              {result && (
                <span className="text-xs text-slate-300">
                  {result.status ? `HTTP ${result.status}` : 'Request error'}
                  {result.durationMs !== null ? ` in ${result.durationMs}ms` : ''}
                </span>
              )}
            </div>
            <CodeBlock value={result?.error || result?.body || operation.sampleResponse} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiExplorer({
  origin,
  defaultChainId,
}: {
  origin: string;
  defaultChainId: string;
}) {
  const grouped = groupOperations();

  return (
    <div id="api-explorer" className="rounded-md border border-slate-700 bg-slate-900 p-4 shadow-xl">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-700 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/60 bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
            <Terminal className="h-4 w-4" />
            Snapshots API
          </div>
          <h2 className="text-2xl font-bold text-white">Interactive API explorer</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Execute public endpoints from the browser, inspect JSON responses, and copy curl commands for automation.
          </p>
        </div>
        <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
          {origin}
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([group, groupOperations]) => (
          <section key={group} className="space-y-3">
            <div className="flex items-baseline gap-3 border-b border-slate-700 pb-3">
              <h3 className="text-base font-semibold text-white">{group}</h3>
              <span className="text-sm text-slate-500">
                {group === 'Catalog' && 'Chain and catalog discovery.'}
                {group === 'Snapshots' && 'Artifact listing and latest signed URLs.'}
                {group === 'Downloads' && 'Specific snapshot download URLs.'}
                {group === 'Operations' && 'Liveness and monitoring.'}
              </span>
            </div>
            <div className="space-y-3">
              {groupOperations.map((operation) => (
                <OperationPanel
                  key={operation.id}
                  operation={operation}
                  origin={origin}
                  defaultChainId={defaultChainId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
