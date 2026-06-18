"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe2, Lock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CustomSnapshotRequest = {
  id: string;
  processorRequestId: string | null;
  chainId: string;
  blockHeight: string;
  compressionType: string;
  databaseBackend: string;
  requestNote: string | null;
  visibility: "private" | "public";
  publishStatus: "private" | "pending_review" | "published" | "rejected";
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
  expiresAt: string | null;
};

function formatBytes(value: string | null) {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return null;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function phaseLabel(value: string | null) {
  if (!value) return null;
  return value.replace(/_/g, " ");
}

function progressPercent(request: CustomSnapshotRequest) {
  if (typeof request.progressPercent === "number") return Math.max(0, Math.min(100, request.progressPercent));
  if (request.status === "completed") return 100;
  if (request.status === "failed") return 100;
  if (request.status === "processing") return 20;
  return 0;
}

function isActiveRequest(request: CustomSnapshotRequest) {
  return request.status === "pending" || request.status === "processing" || request.status === "retrying";
}

export function CustomSnapshotRequests() {
  const [requests, setRequests] = useState<CustomSnapshotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVisibilityId, setSavingVisibilityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRequests(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/account/snapshots", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to load custom snapshots");
      }

      setRequests(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load custom snapshots");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!requests.some(isActiveRequest)) return;
    const interval = window.setInterval(() => {
      loadRequests(false);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [requests]);

  async function updateVisibility(request: CustomSnapshotRequest, visibility: "private" | "public") {
    setSavingVisibilityId(request.id);
    setError(null);

    try {
      const response = await fetch(`/api/account/snapshots/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to update visibility");
      }

      setRequests((current) => current.map((item) => item.id === request.id ? json.data : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setSavingVisibilityId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Custom Snapshots</CardTitle>
          <CardDescription>Your specific-height and custom snapshot requests</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => loadRequests()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="py-8 text-sm text-gray-500">Loading custom snapshots</div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-sm text-gray-500">No custom snapshot requests yet.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const size = formatBytes(request.resultFileSizeBytes);
              const percent = progressPercent(request);
              const active = isActiveRequest(request);
              return (
                <div key={request.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{request.chainId}</span>
                        <Badge variant="outline">{request.status}</Badge>
                        <Badge variant={request.visibility === "public" ? "default" : "secondary"}>
                          {request.visibility}
                        </Badge>
                        <Badge variant="outline">{request.publishStatus}</Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Requested height: {request.blockHeight === "0" ? "latest" : request.blockHeight}</p>
                        {request.resultHeight && <p>Result height: {request.resultHeight}</p>}
                        {size && <p>Size: {size}</p>}
                        {request.resultFileName && <p className="break-all font-mono text-xs">{request.resultFileName}</p>}
                        {request.requestNote && <p>{request.requestNote}</p>}
                        {request.errorMessage && <p className="text-red-600 dark:text-red-400">{request.errorMessage}</p>}
                        {request.expiresAt && request.publishStatus !== "published" && (
                          <p>Private retention target: {formatDate(request.expiresAt)}</p>
                        )}
                      </div>
                      {(active || request.progressPhase || request.progressMessage) && (
                        <div className="mt-3 max-w-xl">
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">
                              {phaseLabel(request.progressPhase) || request.status}
                              {request.progressMessage ? `: ${request.progressMessage}` : ""}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${request.status === "failed" ? "bg-red-500" : "bg-blue-600"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {request.progressUpdatedAt && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Updated {formatDate(request.progressUpdatedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {request.resultFileName && (
                        <Link href={`/chains/${request.chainId}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                          Open chain
                        </Link>
                      )}
                      {request.visibility === "private" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateVisibility(request, "public")}
                          disabled={savingVisibilityId === request.id || !request.resultFileName}
                        >
                          <Globe2 className="mr-2 h-4 w-4" />
                          {request.resultFileName ? "Share" : "Share when ready"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateVisibility(request, "private")}
                          disabled={savingVisibilityId === request.id || !request.resultFileName}
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          {request.resultFileName ? "Make private" : "Sharing when ready"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
