import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/middleware/logger";

type DownloadEventInput = {
  eventType: string;
  result: string;
  chainId: string;
  storageChainId?: string | null;
  snapshotId: string;
  fileName?: string | null;
  databaseBackend?: string | null;
  visibility?: string | null;
  snapshotHeight?: bigint | number | string | null;
  fileSizeBytes?: bigint | number | string | null;
  userId?: string | null;
  tier?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  requestPath?: string | null;
  requestMethod?: string | null;
  rangeHeader?: string | null;
  httpStatus?: number | null;
  responseTimeMs?: number | null;
  bytesTransferred?: bigint | number | string | null;
  transferStatus?: string | null;
  downloadTokenHash?: string | null;
  signedUrlExpiresAt?: Date | string | number | null;
  startedAt?: Date | string | number | null;
  completedAt?: Date | string | number | null;
  metadata?: Prisma.InputJsonObject | null;
};

function nullableText(value: string | null | undefined, maxLength = 2048) {
  if (!value) return undefined;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function toBigIntOrUndefined(value: bigint | number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    return BigInt(Math.max(0, Math.trunc(value)));
  }
  if (!/^\d+$/.test(value)) return undefined;
  return BigInt(value);
}

export function toDateOrUndefined(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function dateFromUnixSeconds(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const seconds = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return new Date(seconds * 1000);
}

export function hashIdentifier(value: string | null | undefined) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function downloadTokenHashFromUrl(downloadUrl: string) {
  try {
    const parsed = new URL(downloadUrl);
    return hashIdentifier(parsed.searchParams.get("md5") || parsed.search);
  } catch {
    return hashIdentifier(downloadUrl);
  }
}

function userIdOrNull(userId: string | null | undefined) {
  if (!userId || userId === "anonymous") return undefined;
  return userId;
}

export async function recordDownloadEvent(input: DownloadEventInput) {
  try {
    await prisma.downloadEvent.create({
      data: {
        eventType: input.eventType,
        result: input.result,
        chainId: input.chainId,
        storageChainId: nullableText(input.storageChainId),
        snapshotId: input.snapshotId,
        fileName: nullableText(input.fileName),
        databaseBackend: nullableText(input.databaseBackend, 128),
        visibility: nullableText(input.visibility, 64),
        snapshotHeight: toBigIntOrUndefined(input.snapshotHeight),
        fileSizeBytes: toBigIntOrUndefined(input.fileSizeBytes),
        userId: userIdOrNull(input.userId),
        tier: nullableText(input.tier, 64),
        ipAddress: nullableText(input.ipAddress, 256),
        userAgent: nullableText(input.userAgent),
        referer: nullableText(input.referer),
        requestPath: nullableText(input.requestPath),
        requestMethod: nullableText(input.requestMethod, 32),
        rangeHeader: nullableText(input.rangeHeader, 256),
        httpStatus: input.httpStatus ?? undefined,
        responseTimeMs: input.responseTimeMs ?? undefined,
        bytesTransferred: toBigIntOrUndefined(input.bytesTransferred),
        transferStatus: nullableText(input.transferStatus, 64),
        downloadTokenHash: nullableText(input.downloadTokenHash, 128),
        signedUrlExpiresAt: toDateOrUndefined(input.signedUrlExpiresAt),
        startedAt: toDateOrUndefined(input.startedAt),
        completedAt: toDateOrUndefined(input.completedAt),
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    logger.warn("Failed to persist download event", {
      eventType: input.eventType,
      result: input.result,
      chainId: input.chainId,
      snapshotId: input.snapshotId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
