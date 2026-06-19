import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Code2, Database, ExternalLink, Terminal } from 'lucide-react';
import { ApiExplorer } from '@/components/api/ApiExplorer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listChains } from '@/lib/nginx/operations';
import { getChainConfig } from '@/lib/config/chains';

export const metadata: Metadata = {
  title: 'Snapshots API',
  description: 'Interactive API explorer and CLI examples for BryanLabs blockchain snapshots.',
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') || 'https';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'https://snapshots.bryanlabs.net';
}

export default async function ApiPage() {
  const origin = await getOrigin();
  const chainInfos = await listChains();
  const chains = chainInfos
    .filter((chain) => chain.snapshotCount > 0)
    .map((chain) => ({
      ...chain,
      name: getChainConfig(chain.chainId).name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const exampleChainId = chains[0]?.chainId || 'cosmoshub-4';
  const latestEndpoint = `${origin}/api/v1/chains/${exampleChainId}/snapshots/latest`;
  const downloadScript = [
    `CHAIN="${exampleChainId}"`,
    `API="${origin}/api/v1/chains/$CHAIN/snapshots/latest?database=pebbledb&include_previous=true"`,
    'URL="$(curl -fsS "$API" | jq -r \'.data.url\')"',
    'aria2c -c -x 8 -s 8 -k 1M --file-allocation=none "$URL"',
  ].join('\n');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="hero-gradient border-b border-slate-800 py-10">
        <div className="container mx-auto px-4 hero-content">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/60 bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
              <Database className="h-4 w-4" />
              Blockchain Snapshots API
            </div>
            <h1 className="text-4xl font-bold tracking-normal md:text-5xl">Interactive snapshot API explorer</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-300">
              Try public JSON endpoints, inspect responses, and copy curl or jq examples for restore automation.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-8 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <Card className="border-slate-700 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-400" />
                  Live Chains
                </CardTitle>
                <CardDescription className="text-slate-400">Detected from the current public catalog.</CardDescription>
              </CardHeader>
              <CardContent>
                {chains.length === 0 ? (
                  <p className="text-sm text-slate-400">No chains are currently listed.</p>
                ) : (
                  <div className="space-y-2">
                    {chains.map((chain) => (
                      <Link
                        key={chain.chainId}
                        href={`/chains/${chain.chainId}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-700 p-3 transition-colors hover:border-blue-400 hover:bg-slate-800"
                      >
                        <div>
                          <div className="text-sm font-medium">{chain.name}</div>
                          <div className="font-mono text-xs text-slate-400">{chain.chainId}</div>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-200">{chain.snapshotCount}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
                <CardDescription className="text-slate-400">Use the same host in browser tests and CLI calls.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock>{origin}</CodeBlock>
              </CardContent>
            </Card>
          </aside>

          <ApiExplorer origin={origin} defaultChainId={exampleChainId} />
        </div>

        <section id="cli-examples" className="rounded-md border border-slate-700 bg-slate-900 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Terminal className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">curl and jq examples</h2>
              <p className="text-sm text-slate-400">Use the current catalog chain ids shown above.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Inspect the latest snapshot</h3>
              <CodeBlock>{`curl -fsS '${latestEndpoint}' | jq .`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Prefer PebbleDB and include fallback artifacts</h3>
              <CodeBlock>{`curl -fsS '${latestEndpoint}?database=pebbledb&include_previous=true' | jq '.data | {height, database_backend, expires_at, previous: (.previous | length)}'`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Download with aria2c resume support</h3>
              <CodeBlock>{downloadScript}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">List all scheduled artifacts for a chain</h3>
              <CodeBlock>{`curl -fsS '${origin}/api/v1/chains/${exampleChainId}/snapshots' \\
  | jq '.data[] | select(.isCustom != true) | {height, databaseBackend, size, fileName}'`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Group artifacts by database backend</h3>
              <CodeBlock>{`curl -fsS '${origin}/api/v1/chains/${exampleChainId}/snapshots' \\
  | jq '.data | group_by(.databaseBackend) | map({db: .[0].databaseBackend, count: length, heights: map(.height)})'`}</CodeBlock>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Response contract</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            The latest endpoint returns a short-lived signed URL plus ready-to-run download commands. Refresh the URL before each long automation run.
          </p>
          <div className="mt-4">
            <CodeBlock>{`{
  "success": true,
  "data": {
    "chain_id": "${exampleChainId}",
    "height": 123456,
    "size": 123456789,
    "url": "https://snaps.bryanlabs.net/secure/...",
    "expires_at": "2026-06-19T18:00:00.000Z",
    "database_backend": "pebbledb",
    "latest": {
      "file_name": "${exampleChainId}-123456-YYYYMMDD-HHMMSS.tar.zst",
      "commands": {
        "curl": "curl -L -C - -O ...",
        "aria2c": "aria2c -c -x 8 -s 8 -k 1M ..."
      }
    },
    "previous": []
  }
}`}</CodeBlock>
          </div>
          <Link href="/chains" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300">
            Browse chain catalog
            <ExternalLink className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
