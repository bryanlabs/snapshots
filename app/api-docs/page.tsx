import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Code2, Download, ExternalLink, Globe, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listChains } from "@/lib/nginx/operations";
import { getChainConfig } from "@/lib/config/chains";

export const metadata: Metadata = {
  title: "API and CLI Access",
  description: "API endpoints and CLI examples for BryanLabs blockchain snapshots.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 p-4 text-xs text-gray-200">
      <code>{children}</code>
    </pre>
  );
}

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") || "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "https://snapshots.bryanlabs.net";
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

  const exampleChainId = chains[0]?.chainId || "{chainId}";
  const latestEndpoint = `${origin}/api/v1/chains/${exampleChainId}/snapshots/latest`;
  const downloadScript = [
    `CHAIN="${exampleChainId}"`,
    `API="${origin}/api/v1/chains/$CHAIN/snapshots/latest?database=pebbledb&include_previous=true"`,
    'URL="$(curl -fsS "$API" | jq -r \'.data.url\')"',
    'aria2c -c -x 8 -s 8 -k 1M --file-allocation=none "$URL"',
  ].join("\n");

  return (
    <div className="min-h-screen">
      <section className="border-b border-gray-800 bg-gray-950 py-10 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-300">
              <Terminal className="h-4 w-4" />
              API and CLI access
            </div>
            <h1 className="text-4xl font-bold">Use snapshots from scripts</h1>
            <p className="mt-4 text-lg text-gray-300">
              Generate signed latest-snapshot URLs, choose LevelDB or PebbleDB, and fetch artifacts with resumable command-line clients.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-8 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Live Chains
              </CardTitle>
              <CardDescription>Detected from the current public catalog</CardDescription>
            </CardHeader>
            <CardContent>
              {chains.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chains are currently listed.</p>
              ) : (
                <div className="space-y-2">
                  {chains.map((chain) => (
                    <Link
                      key={chain.chainId}
                      href={`/chains/${chain.chainId}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <div className="text-sm font-medium">{chain.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{chain.chainId}</div>
                      </div>
                      <Badge variant="outline">{chain.snapshotCount}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-500" />
                Latest Snapshot Endpoint
              </CardTitle>
              <CardDescription>
                Returns a short-lived signed URL plus ready-to-run download commands.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock>{`GET ${origin}/api/v1/chains/{chainId}/snapshots/latest`}</CodeBlock>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">database</div>
                  <div className="mt-1 text-muted-foreground">leveldb, goleveldb, pebble, pebbledb, or any</div>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">include_previous</div>
                  <div className="mt-1 text-muted-foreground">true returns backup candidates</div>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">auth</div>
                  <div className="mt-1 text-muted-foreground">optional browser session; anonymous works for public artifacts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-500" />
              CLI Examples
            </CardTitle>
            <CardDescription>Use the current catalog chain ids shown above.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Inspect the latest snapshot</h2>
              <CodeBlock>{`curl -fsS "${latestEndpoint}" | jq .`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Prefer PebbleDB and include fallback artifacts</h2>
              <CodeBlock>{`curl -fsS "${latestEndpoint}?database=pebbledb&include_previous=true" | jq .`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Download with aria2c resume support</h2>
              <CodeBlock>{downloadScript}</CodeBlock>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">List all snapshots for a chain</h2>
              <CodeBlock>{`curl -fsS "${origin}/api/v1/chains/${exampleChainId}/snapshots" | jq '.data[] | {height, databaseBackend, size, fileName}'`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Response Contract
            </CardTitle>
            <CardDescription>The latest endpoint returns enough information to download without parsing filenames.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock>{`{
  "success": true,
  "data": {
    "chain_id": "${exampleChainId}",
    "height": 123456,
    "size": 123456789,
    "url": "https://snaps.bryanlabs.net/secure/...",
    "expires_at": "2026-06-14T18:00:00.000Z",
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
            <p className="text-sm text-muted-foreground">
              Signed URLs expire. For long automation runs, ask the API for a fresh URL before starting each download.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-400">
              Open dashboard
              <ExternalLink className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
