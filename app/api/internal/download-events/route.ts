import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  dateFromUnixSeconds,
  hashIdentifier,
  recordDownloadEvent,
} from "@/lib/download/events";

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.DOWNLOAD_EVENTS_INTERNAL_SECRET || process.env.SECURE_LINK_SECRET;
  const provided = request.headers.get("x-download-events-secret");
  if (!expected || !provided) return false;
  return timingSafeEqual(provided, expected);
}

function intHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function durationMsHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name);
  if (!value) return undefined;
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined;
}

function normalizeSnapshotPath(storageChainId: string, fileName: string) {
  if (storageChainId !== "_custom") {
    return {
      chainId: storageChainId,
      storageChainId,
      snapshotId: fileName,
      fileName,
    };
  }

  const parts = fileName.split("/");
  const chainId = parts[0] || "_custom";
  const requestId = parts[1];
  const artifactName = parts.slice(2).join("/") || fileName;

  return {
    chainId,
    storageChainId: requestId ? `_custom/${chainId}/${requestId}` : storageChainId,
    snapshotId: requestId ? `${requestId}/${artifactName}` : fileName,
    fileName: artifactName,
  };
}

function resultFromStatus(httpStatus?: number, transferStatus?: string | null) {
  if (!httpStatus) return "unknown";
  if (httpStatus >= 200 && httpStatus < 400 && transferStatus === "OK") return "success";
  if (httpStatus >= 400) return "http_error";
  return transferStatus ? transferStatus.toLowerCase() : "aborted";
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const storageChainHeader = request.headers.get("x-download-event-chain-id");
  const fileNameHeader = request.headers.get("x-download-event-file-name");

  if (!storageChainHeader || !fileNameHeader) {
    return NextResponse.json(
      { success: false, error: "Missing download event identity" },
      { status: 400 }
    );
  }

  const httpStatus = intHeader(request, "x-download-event-status");
  const transferStatus = request.headers.get("x-download-event-completion") || "aborted";
  const normalized = normalizeSnapshotPath(storageChainHeader, fileNameHeader);
  const result = resultFromStatus(httpStatus, transferStatus);

  await recordDownloadEvent({
    eventType: result === "success" ? "transfer_completed" : "transfer_failed",
    result,
    chainId: normalized.chainId,
    storageChainId: normalized.storageChainId,
    snapshotId: normalized.snapshotId,
    fileName: normalized.fileName,
    tier: request.headers.get("x-download-event-tier"),
    ipAddress: request.headers.get("x-download-event-ip"),
    userAgent: request.headers.get("x-download-event-user-agent"),
    referer: request.headers.get("x-download-event-referer"),
    requestPath: request.headers.get("x-download-event-path"),
    requestMethod: request.headers.get("x-download-event-method"),
    rangeHeader: request.headers.get("x-download-event-range"),
    httpStatus,
    responseTimeMs: durationMsHeader(request, "x-download-event-request-time"),
    bytesTransferred: request.headers.get("x-download-event-bytes"),
    transferStatus,
    downloadTokenHash: hashIdentifier(request.headers.get("x-download-event-token")),
    signedUrlExpiresAt: dateFromUnixSeconds(request.headers.get("x-download-event-expires")),
    completedAt: new Date(),
    metadata: {
      source: "nginx-post-action",
    },
  });

  return NextResponse.json({ success: true });
}
