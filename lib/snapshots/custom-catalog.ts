import { prisma } from "@/lib/prisma";
import {
  listSnapshots,
  listSnapshotsForStoragePrefix,
  type Snapshot as NginxSnapshot,
} from "@/lib/nginx/operations";
import { extractHeightFromFilename } from "@/lib/config/supported-formats";
import { getCanonicalChainId, isSnapshotChainConfigured } from "@/lib/config/chains";
import { canAccessSnapshot } from "@/lib/utils/tier";
import type { Snapshot as ApiSnapshot } from "@/lib/types";

export type CatalogUser = {
  id?: string | null;
  role?: string | null;
  tier?: string | null;
};

type CustomRequest = Awaited<ReturnType<typeof loadCustomRequestsForChain>>[number];

const PROCESSOR_TERMINAL_STATUSES = new Set(["completed", "failed"]);

function normalizeCompression(compressionType?: string | null) {
  if (!compressionType) return "zst";
  if (compressionType === "zstd") return "zst";
  return compressionType;
}

function toNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function parseOptionalInt(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function progressUpdateFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return {};

  const updateData: Record<string, unknown> = {};
  if (typeof metadata.progress_phase === "string") updateData.progressPhase = metadata.progress_phase;
  if (typeof metadata.progress_message === "string") updateData.progressMessage = metadata.progress_message;

  const progressPercent = parseOptionalInt(metadata.progress_percent);
  if (progressPercent !== undefined) updateData.progressPercent = progressPercent;

  const progressEtaSeconds = parseOptionalInt(metadata.progress_eta_seconds);
  if (progressEtaSeconds !== undefined) updateData.progressEtaSeconds = progressEtaSeconds;

  const progressUpdatedAt = parseOptionalDate(metadata.progress_updated_at);
  if (progressUpdatedAt) updateData.progressUpdatedAt = progressUpdatedAt;

  return updateData;
}

function processorUrl() {
  return process.env.SNAPSHOT_PROCESSOR_URL || "http://snapshot-processor:8080";
}

function snapshotTimestamp(snapshot: NginxSnapshot) {
  return snapshot.lastModified instanceof Date
    ? snapshot.lastModified
    : new Date(snapshot.lastModified);
}

function customRequestKey(request: {
  chainId: string;
  blockHeight: bigint;
  compressionType: string;
  databaseBackend: string;
}) {
  return [
    request.chainId,
    toNumber(request.blockHeight),
    normalizeCompression(request.compressionType),
    request.databaseBackend || "goleveldb",
  ].join(":");
}

function customStoragePrefix(request: CustomRequest) {
  return `_custom/${request.chainId}/${request.id}`;
}

function snapshotKey(snapshot: NginxSnapshot | ApiSnapshot) {
  const height = "height" in snapshot
    ? snapshot.height || 0
    : extractHeightFromFilename(snapshot.filename) || 0;
  const compression = "compressionType" in snapshot
    ? normalizeCompression(snapshot.compressionType)
    : "zst";

  return [
    snapshot.chainId,
    height,
    compression,
    snapshot.databaseBackend || "goleveldb",
  ].join(":");
}

async function loadCustomRequestsForChain(chainId: string) {
  try {
    return await prisma.snapshotRequest.findMany({
      where: {
        chainId,
        deletedAt: null,
      },
      orderBy: [
        { isPinned: "desc" },
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });
  } catch (error) {
    console.error("Failed to load custom snapshot requests", chainId, error);
    return [];
  }
}

async function fetchProcessorRequest(processorRequestId: string) {
  try {
    const response = await fetch(`${processorUrl()}/api/v1/requests/${processorRequestId}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Failed to fetch processor request status", processorRequestId, error);
    return null;
  }
}

function findResultSnapshot(request: CustomRequest, snapshots: NginxSnapshot[]) {
  const expectedHeight = toNumber(request.blockHeight);
  const expectedCompression = normalizeCompression(request.compressionType);
  const createdAt = request.createdAt.getTime() - 60_000;

  const matches = snapshots.filter((snapshot) => {
    if (snapshot.chainId !== request.chainId) return false;
    if ((snapshot.databaseBackend || "goleveldb") !== (request.databaseBackend || "goleveldb")) return false;
    if (normalizeCompression(snapshot.compressionType) !== expectedCompression) return false;
    if (expectedHeight > 0 && (snapshot.height || 0) !== expectedHeight) return false;
    return snapshotTimestamp(snapshot).getTime() >= createdAt;
  });

  matches.sort((a, b) => snapshotTimestamp(b).getTime() - snapshotTimestamp(a).getTime());
  return matches[0] || null;
}

async function syncRequestFromProcessor(request: CustomRequest, snapshots: NginxSnapshot[]) {
  const updateData: Record<string, unknown> = {};

  if (request.processorRequestId && !PROCESSOR_TERMINAL_STATUSES.has(request.status)) {
    const processorRequest = await fetchProcessorRequest(request.processorRequestId);

    if (processorRequest?.status) {
      Object.assign(updateData, progressUpdateFromMetadata(processorRequest.metadata));
      updateData.status = processorRequest.status;

      if (processorRequest.status === "failed") {
        updateData.errorMessage = processorRequest.status_message || "Processor request failed";
      }

      if (processorRequest.status === "completed") {
        updateData.completedAt = processorRequest.completed_at
          ? new Date(processorRequest.completed_at)
          : new Date();
      }
    }
  }

  if (!request.resultFileName) {
    const customSnapshots = await listSnapshotsForStoragePrefix(customStoragePrefix(request), {
      chainId: request.chainId,
      storageChainId: customStoragePrefix(request),
      databaseBackend: (request.databaseBackend || "goleveldb") as "goleveldb" | "pebbledb",
      databaseLabel: request.databaseBackend === "pebbledb" ? "PebbleDB" : "LevelDB",
    });
    const resultSnapshot = findResultSnapshot(request, [...customSnapshots, ...snapshots]);

    if (resultSnapshot) {
      updateData.status = "completed";
      updateData.completedAt = request.completedAt || new Date();
      updateData.resultStorageChainId = resultSnapshot.storageChainId;
      updateData.resultFileName = resultSnapshot.filename;
      updateData.resultFileSizeBytes = BigInt(resultSnapshot.size);
      updateData.resultHeight = BigInt(resultSnapshot.height || extractHeightFromFilename(resultSnapshot.filename) || 0);
      updateData.verifiedAt = new Date();
      updateData.resultMetadata = {
        matched_by: "nginx-catalog",
        storage_chain_id: resultSnapshot.storageChainId,
        database_backend: resultSnapshot.databaseBackend || "goleveldb",
      };
      updateData.progressPhase = "complete";
      updateData.progressMessage = "Snapshot is ready";
      updateData.progressPercent = 100;
      updateData.progressEtaSeconds = null;
      updateData.progressUpdatedAt = new Date();
    }
  }

  if (Object.keys(updateData).length === 0) return false;

  await prisma.snapshotRequest.update({
    where: { id: request.id },
    data: updateData,
  });

  return true;
}

export async function syncCustomRequestsForChain(chainId: string, snapshots: NginxSnapshot[]) {
  const canonicalChainId = getCanonicalChainId(chainId);
  const requests = await loadCustomRequestsForChain(canonicalChainId);
  let changed = false;

  for (const request of requests) {
    try {
      changed = (await syncRequestFromProcessor(request, snapshots)) || changed;
    } catch (error) {
      console.error("Failed to sync custom snapshot request", request.id, error);
    }
  }

  return changed ? loadCustomRequestsForChain(canonicalChainId) : requests;
}

function requestForSnapshot(snapshot: NginxSnapshot, requests: CustomRequest[]) {
  if (!requests.length) return null;

  const byFileName = requests.find((request) =>
    request.resultFileName === snapshot.filename &&
    (!request.resultStorageChainId || request.resultStorageChainId === snapshot.storageChainId)
  );

  if (byFileName) return byFileName;

  const key = snapshotKey(snapshot);
  return requests.find((request) => customRequestKey(request) === key) || null;
}

function canSeeCustomSnapshot(request: CustomRequest, user: CatalogUser | null | undefined) {
  if (request.deletedAt) return false;
  if (request.publishStatus === "published" && request.visibility === "public") return true;
  if (!user?.id) return false;
  if (user.role === "admin") return true;
  return request.userId === user.id;
}

function customMetadata(request: CustomRequest, user: CatalogUser | null | undefined) {
  const isOwner = Boolean(user?.id && request.userId === user.id);

  return {
    isCustom: true,
    customSnapshotRequestId: request.id,
    customVisibility: request.visibility as "private" | "public",
    customPublishStatus: request.publishStatus as ApiSnapshot["customPublishStatus"],
    requestedByUserId: request.userId,
    isOwner,
    isCommunity: request.visibility === "public" && request.publishStatus === "published",
    isPinned: request.isPinned,
    isFeatured: request.isFeatured,
    requestNote: request.requestNote || undefined,
    adminNote: user?.role === "admin" ? request.adminNote || undefined : undefined,
    restoreVerifiedAt: request.restoreVerifiedAt?.toISOString(),
    isRestoreVerified: Boolean(request.restoreVerifiedAt),
  };
}

function apiSnapshotFromCustomRequest(request: CustomRequest, user: CatalogUser | null | undefined): ApiSnapshot | null {
  if (!request.resultFileName || !request.resultStorageChainId) return null;

  const height = toNumber(request.resultHeight) || toNumber(request.blockHeight);
  const createdAt = request.completedAt || request.verifiedAt || request.updatedAt || request.createdAt;
  const apiSnapshot: ApiSnapshot = {
    id: `${request.resultStorageChainId}:${request.resultFileName}`,
    chainId: request.chainId,
    storageChainId: request.resultStorageChainId,
    databaseBackend: request.databaseBackend || "goleveldb",
    databaseLabel: request.databaseBackend === "pebbledb" ? "PebbleDB" : "LevelDB",
    height,
    size: toNumber(request.resultFileSizeBytes),
    fileName: request.resultFileName,
    createdAt,
    updatedAt: request.updatedAt || createdAt,
    type: "pruned",
    compressionType: normalizeCompression(request.compressionType) as ApiSnapshot["compressionType"],
    ...customMetadata(request, user),
  };

  return {
    ...apiSnapshot,
    isAccessible: canAccessSnapshot(apiSnapshot, user?.tier),
    userTier: user?.tier || "free",
  };
}

export async function buildSnapshotCatalog(chainId: string, user?: CatalogUser | null): Promise<ApiSnapshot[]> {
  const canonicalChainId = getCanonicalChainId(chainId);
  if (!isSnapshotChainConfigured(canonicalChainId)) {
    return [];
  }

  const nginxSnapshots = await listSnapshots(canonicalChainId);
  const customRequests = await syncCustomRequestsForChain(canonicalChainId, nginxSnapshots);
  const includedCustomRequestIds = new Set<string>();

  const snapshots = nginxSnapshots
    .map((snapshot) => {
      const customRequest = requestForSnapshot(snapshot, customRequests);
      if (customRequest) {
        includedCustomRequestIds.add(customRequest.id);
      }

      if (customRequest && !canSeeCustomSnapshot(customRequest, user)) {
        return null;
      }

      const height = extractHeightFromFilename(snapshot.filename) || snapshot.height || 0;
      const apiSnapshot: ApiSnapshot = {
        id: `${snapshot.storageChainId}:${snapshot.filename}`,
        chainId: canonicalChainId,
        storageChainId: snapshot.storageChainId,
        databaseBackend: snapshot.databaseBackend,
        databaseLabel: snapshot.databaseLabel,
        height,
        size: snapshot.size,
        fileName: snapshot.filename,
        createdAt: snapshot.lastModified,
        updatedAt: snapshot.lastModified,
        type: "pruned",
        compressionType: (snapshot.compressionType || "zst") as ApiSnapshot["compressionType"],
        ...(customRequest ? customMetadata(customRequest, user) : {}),
      };

      return {
        ...apiSnapshot,
        isAccessible: canAccessSnapshot(apiSnapshot, user?.tier),
        userTier: user?.tier || "free",
      };
    })
    .filter(Boolean) as ApiSnapshot[];

  for (const request of customRequests) {
    if (includedCustomRequestIds.has(request.id)) continue;
    if (!canSeeCustomSnapshot(request, user)) continue;
    const customSnapshot = apiSnapshotFromCustomRequest(request, user);
    if (customSnapshot) {
      snapshots.push(customSnapshot);
    }
  }

  snapshots.sort((a, b) => {
    const aCustomRank = a.isCustom ? (a.isPinned ? 2 : a.isFeatured ? 1 : 0) : 0;
    const bCustomRank = b.isCustom ? (b.isPinned ? 2 : b.isFeatured ? 1 : 0) : 0;
    if (aCustomRank !== bCustomRank) return bCustomRank - aCustomRank;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return snapshots;
}

export async function getSnapshotFromCatalog(
  chainId: string,
  snapshotId: string,
  user?: CatalogUser | null
) {
  const snapshots = await buildSnapshotCatalog(chainId, user);
  return snapshots.find((snapshot) => snapshot.id === snapshotId) || null;
}
