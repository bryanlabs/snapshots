import { NextRequest } from "next/server";

jest.mock("@/lib/download/events", () => {
  const actual = jest.requireActual("@/lib/download/events");
  return {
    ...actual,
    recordDownloadEvent: jest.fn(),
  };
});

import { POST } from "@/app/api/internal/download-events/route";
import { recordDownloadEvent } from "@/lib/download/events";

describe("/api/internal/download-events", () => {
  const originalSecureLinkSecret = process.env.SECURE_LINK_SECRET;
  const mockRecordDownloadEvent = recordDownloadEvent as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECURE_LINK_SECRET = "test-secret";
    mockRecordDownloadEvent.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env.SECURE_LINK_SECRET = originalSecureLinkSecret;
  });

  it("rejects requests without the internal callback secret", async () => {
    const request = new NextRequest("http://localhost:3000/api/internal/download-events", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockRecordDownloadEvent).not.toHaveBeenCalled();
  });

  it("records completed nginx transfer callbacks", async () => {
    const request = new NextRequest("http://localhost:3000/api/internal/download-events", {
      method: "POST",
      headers: {
        "x-download-events-secret": "test-secret",
        "x-download-event-chain-id": "cosmoshub-4",
        "x-download-event-file-name": "cosmoshub-4-31577955-20260614-160005.tar.zst",
        "x-download-event-status": "206",
        "x-download-event-bytes": "1048576",
        "x-download-event-request-time": "1.25",
        "x-download-event-completion": "OK",
        "x-download-event-ip": "203.0.113.10",
        "x-download-event-user-agent": "aria2/1.37.0",
        "x-download-event-path": "/snapshots/cosmoshub-4/cosmoshub-4-31577955-20260614-160005.tar.zst",
        "x-download-event-method": "GET",
        "x-download-event-range": "bytes=0-1048575",
        "x-download-event-tier": "ultra",
        "x-download-event-token": "signed-token",
        "x-download-event-expires": "1781543207",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRecordDownloadEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "transfer_completed",
      result: "success",
      chainId: "cosmoshub-4",
      storageChainId: "cosmoshub-4",
      snapshotId: "cosmoshub-4-31577955-20260614-160005.tar.zst",
      fileName: "cosmoshub-4-31577955-20260614-160005.tar.zst",
      tier: "ultra",
      ipAddress: "203.0.113.10",
      userAgent: "aria2/1.37.0",
      requestMethod: "GET",
      rangeHeader: "bytes=0-1048575",
      httpStatus: 206,
      responseTimeMs: 1250,
      bytesTransferred: "1048576",
      transferStatus: "OK",
      signedUrlExpiresAt: new Date(1781543207 * 1000),
    }));
  });

  it("normalizes private custom snapshot paths", async () => {
    const request = new NextRequest("http://localhost:3000/api/internal/download-events", {
      method: "POST",
      headers: {
        "x-download-events-secret": "test-secret",
        "x-download-event-chain-id": "_custom",
        "x-download-event-file-name": "noble-1/req123/noble-1-19000000-custom.tar.zst",
        "x-download-event-status": "200",
        "x-download-event-bytes": "42",
        "x-download-event-request-time": "0.1",
        "x-download-event-completion": "OK",
      },
    });

    await POST(request);

    expect(mockRecordDownloadEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "transfer_completed",
      result: "success",
      chainId: "noble-1",
      storageChainId: "_custom/noble-1/req123",
      snapshotId: "req123/noble-1-19000000-custom.tar.zst",
      fileName: "noble-1-19000000-custom.tar.zst",
    }));
  });
});
