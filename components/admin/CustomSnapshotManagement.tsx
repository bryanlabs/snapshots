"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RefreshCw, Save, Search, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminCustomSnapshot = {
  id: string;
  processorRequestId: string | null;
  chainId: string;
  blockHeight: string;
  compressionType: string;
  databaseBackend: string;
  requestNote: string | null;
  visibility: "private" | "public";
  publishStatus: "private" | "pending_review" | "published" | "rejected";
  isPinned: boolean;
  isFeatured: boolean;
  deletedAt: string | null;
  adminNote: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "retrying";
  errorMessage: string | null;
  progressPhase: string | null;
  progressMessage: string | null;
  progressPercent: number | null;
  progressEtaSeconds: number | null;
  progressUpdatedAt: string | null;
  retentionDays: number;
  resultStorageChainId: string | null;
  resultFileName: string | null;
  resultFileSizeBytes: string | null;
  resultHeight: string | null;
  verifiedAt: string | null;
  restoreVerifiedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    role: string;
    tier: string | null;
  } | null;
};

type Draft = {
  visibility: "private" | "public";
  publishStatus: "private" | "pending_review" | "published" | "rejected";
  isPinned: boolean;
  isFeatured: boolean;
  adminNote: string;
};

const publishStatuses = ["private", "pending_review", "published", "rejected"] as const;

type Tone = "green" | "amber" | "blue" | "red" | "gray";
type HostingKind = "hosted" | "expiring" | "expired" | "removed" | "community" | "processing" | "failed";

const toneClass: Record<Tone, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

function identity(snapshot: AdminCustomSnapshot) {
  return snapshot.user?.email || snapshot.user?.walletAddress || snapshot.user?.displayName || snapshot.user?.id || "unknown user";
}

function shortWallet(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}…${value.slice(-5)}`;
}

function formatBytes(value: string | null) {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return null;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Derive whether the artifact is still hosted. This is computed from the
 * retention window (completedAt + retentionDays); Phase 2 adds a processor
 * reconcile that confirms physical presence on storage.
 */
function hostingStatus(s: AdminCustomSnapshot): { kind: HostingKind; tone: Tone; label: string } {
  if (s.deletedAt) return { kind: "removed", tone: "gray", label: "Removed by admin" };
  if (s.status === "failed") return { kind: "failed", tone: "red", label: "Failed" };
  if (s.status !== "completed") return { kind: "processing", tone: "blue", label: s.status };
  if (s.publishStatus === "published") return { kind: "community", tone: "green", label: "Hosted · community" };

  const base = s.completedAt ? new Date(s.completedAt) : new Date(s.createdAt);
  const expiresAt = base.getTime() + s.retentionDays * 24 * 60 * 60 * 1000;
  const msLeft = expiresAt - Date.now();
  if (msLeft <= 0) return { kind: "expired", tone: "gray", label: "Expired · bytes removed" };

  const hoursLeft = Math.max(1, Math.round(msLeft / (60 * 60 * 1000)));
  if (hoursLeft <= 6) return { kind: "expiring", tone: "amber", label: `Expiring in ${hoursLeft}h` };
  return { kind: "hosted", tone: "green", label: `Hosted · expires in ${hoursLeft}h` };
}

const HOSTED_KINDS: HostingKind[] = ["hosted", "expiring", "community"];

export function CustomSnapshotManagement() {
  const [snapshots, setSnapshots] = useState<AdminCustomSnapshot[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    let priv = 0;
    let community = 0;
    let hosted = 0;
    let hostedBytes = 0;
    for (const snapshot of snapshots) {
      if (snapshot.publishStatus === "published") community += 1;
      else priv += 1;
      const host = hostingStatus(snapshot);
      if (HOSTED_KINDS.includes(host.kind)) {
        hosted += 1;
        const bytes = Number(snapshot.resultFileSizeBytes || 0);
        if (Number.isFinite(bytes)) hostedBytes += bytes;
      }
    }
    return { priv, community, hosted, hostedGb: hostedBytes / 1024 / 1024 / 1024 };
  }, [snapshots]);

  async function loadSnapshots(search = query) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/custom-snapshots?q=${encodeURIComponent(search)}`, { cache: "no-store" });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to load custom snapshots");
      }

      setSnapshots(json.data);
      setDrafts(Object.fromEntries(json.data.map((snapshot: AdminCustomSnapshot) => [
        snapshot.id,
        {
          visibility: snapshot.visibility,
          publishStatus: snapshot.publishStatus,
          isPinned: snapshot.isPinned,
          isFeatured: snapshot.isFeatured,
          adminNote: snapshot.adminNote || "",
        },
      ])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load custom snapshots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshots("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
      },
    }));
  }

  async function save(snapshot: AdminCustomSnapshot) {
    const draft = drafts[snapshot.id];
    if (!draft) return;

    setSavingId(snapshot.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/custom-snapshots/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          reason: "admin custom snapshot management",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save custom snapshot");
      }

      await loadSnapshots(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save custom snapshot");
    } finally {
      setSavingId(null);
    }
  }

  async function quickPublish(snapshot: AdminCustomSnapshot) {
    setSavingId(snapshot.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/custom-snapshots/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibility: "public",
          publishStatus: "published",
          isPinned: drafts[snapshot.id]?.isPinned ?? snapshot.isPinned,
          isFeatured: drafts[snapshot.id]?.isFeatured ?? snapshot.isFeatured,
          adminNote: drafts[snapshot.id]?.adminNote ?? snapshot.adminNote ?? "",
          reason: "admin custom snapshot publish",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to publish custom snapshot");
      }

      await loadSnapshots(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish custom snapshot");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteSnapshot(snapshot: AdminCustomSnapshot) {
    const confirmed = window.confirm(`Delete custom snapshot request ${snapshot.id}? This hides it from catalogs but does not manually remove storage files.`);
    if (!confirmed) return;

    setSavingId(snapshot.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/custom-snapshots/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleted: true,
          reason: "admin custom snapshot delete",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to delete custom snapshot");
      }

      await loadSnapshots(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete custom snapshot");
    } finally {
      setSavingId(null);
    }
  }

  const statCards = [
    { label: "Private", value: String(stats.priv) },
    { label: "Community", value: String(stats.community) },
    { label: "Hosted on disk", value: String(stats.hosted) },
    { label: "Custom storage", value: `${stats.hostedGb.toFixed(1)} GB` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Custom Snapshot Requests</CardTitle>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              loadSnapshots(query);
            }}
          >
            <div className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests"
              />
            </div>
            <Button type="submit" variant="outline" size="icon" aria-label="Search custom snapshots">
              <Search className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => loadSnapshots(query)} aria-label="Refresh custom snapshots">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
          {loading ? (
            <div className="py-8 text-sm text-gray-500">Loading custom snapshots</div>
          ) : snapshots.length === 0 ? (
            <div className="py-8 text-sm text-gray-500">No custom snapshot requests found.</div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => {
                const draft = drafts[snapshot.id];
                const size = formatBytes(snapshot.resultFileSizeBytes);
                const host = hostingStatus(snapshot);
                const wallet = shortWallet(snapshot.user?.walletAddress || snapshot.user?.id);
                const isSaving = savingId === snapshot.id;
                return (
                  <div
                    key={snapshot.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {snapshot.chainId} · height {snapshot.blockHeight === "0" ? "latest" : snapshot.blockHeight}
                        </div>
                        {snapshot.requestNote && (
                          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{snapshot.requestNote}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={host.tone}>{host.label}</Pill>
                        <Pill tone={snapshot.status === "failed" ? "red" : "gray"}>{snapshot.status}</Pill>
                        {snapshot.isPinned && <Pill tone="blue">pinned</Pill>}
                        {snapshot.isFeatured && <Pill tone="blue">featured</Pill>}
                        {snapshot.restoreVerifiedAt && <Pill tone="green">restore verified</Pill>}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{snapshot.databaseBackend}</span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{snapshot.compressionType}</span>
                      {size && <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{size}</span>}
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">{identity(snapshot)}</span>
                        {wallet && <span className="font-mono text-gray-400">{wallet}</span>}
                      </span>
                      {snapshot.user?.tier && <span className="text-gray-400">{snapshot.user.tier}</span>}
                    </div>

                    {snapshot.resultFileName && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate font-mono">{snapshot.resultFileName}</span>
                        <button
                          type="button"
                          aria-label="Copy filename"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          onClick={() => navigator.clipboard?.writeText(snapshot.resultFileName || "")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {snapshot.errorMessage && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400">{snapshot.errorMessage}</div>
                    )}

                    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <label className="flex flex-col gap-1 text-xs text-gray-500">
                        Visibility
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={draft?.visibility || snapshot.visibility}
                          onChange={(event) => updateDraft(snapshot.id, { visibility: event.target.value as Draft["visibility"] })}
                        >
                          <option value="private">private</option>
                          <option value="public">public</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-gray-500">
                        Publish
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={draft?.publishStatus || snapshot.publishStatus}
                          onChange={(event) => updateDraft(snapshot.id, { publishStatus: event.target.value as Draft["publishStatus"] })}
                        >
                          {publishStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-center gap-3 pb-1.5">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={draft?.isPinned || false}
                            onChange={(event) => updateDraft(snapshot.id, { isPinned: event.target.checked })}
                          />
                          <span>Pin</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={draft?.isFeatured || false}
                            onChange={(event) => updateDraft(snapshot.id, { isFeatured: event.target.checked })}
                          />
                          <span>Feature</span>
                        </label>
                      </div>
                      <div className="ml-auto flex items-center gap-2 pb-1.5">
                        {snapshot.status === "completed" && (
                          <Button size="sm" variant="outline" onClick={() => quickPublish(snapshot)} disabled={isSaving}>
                            Publish
                          </Button>
                        )}
                        <Button size="sm" onClick={() => save(snapshot)} disabled={isSaving}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSnapshot(snapshot)}
                          disabled={isSaving}
                          aria-label={`Delete custom snapshot ${snapshot.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <textarea
                      className="mt-3 min-h-16 w-full rounded-md border bg-background px-2 py-1 text-sm"
                      value={draft?.adminNote || ""}
                      onChange={(event) => updateDraft(snapshot.id, { adminNote: event.target.value })}
                      placeholder="Optional admin note"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
