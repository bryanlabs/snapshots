import { buildSnapshotCatalog } from "@/lib/snapshots/custom-catalog";
import { prisma } from "@/lib/prisma";
import { listSnapshots, listSnapshotsForStoragePrefix } from "@/lib/nginx/operations";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    snapshotRequest: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/nginx/operations", () => ({
  listSnapshots: jest.fn(),
  listSnapshotsForStoragePrefix: jest.fn(),
}));

const completedPrivateRequest = {
  id: "req-private",
  userId: "owner-1",
  processorRequestId: "processor-1",
  chainId: "noble-1",
  blockHeight: BigInt(52756275),
  pruningMode: "custom",
  compressionType: "zstd",
  databaseBackend: "goleveldb",
  requestNote: "restore test",
  visibility: "private",
  publishStatus: "private",
  isPinned: false,
  isFeatured: false,
  deletedAt: null,
  adminNote: null,
  scheduleType: "once",
  status: "completed",
  priority: 100,
  errorMessage: null,
  resultSnapshotId: null,
  resultStorageChainId: "noble-1",
  resultFileName: "noble-1-52756275-20260614-045134.tar.zst",
  resultFileSizeBytes: BigInt(1200),
  resultHeight: BigInt(52756275),
  resultMetadata: null,
  verifiedAt: new Date("2026-06-14T05:00:00Z"),
  restoreVerifiedAt: null,
  creditsCost: 0,
  retentionDays: 30,
  createdAt: new Date("2026-06-14T04:50:00Z"),
  updatedAt: new Date("2026-06-14T05:00:00Z"),
  completedAt: new Date("2026-06-14T05:00:00Z"),
};

const nginxSnapshot = {
  filename: "noble-1-52756275-20260614-045134.tar.zst",
  chainId: "noble-1",
  storageChainId: "noble-1",
  size: 1200,
  lastModified: new Date("2026-06-14T04:51:34Z"),
  height: 52756275,
  compressionType: "zst",
  databaseBackend: "goleveldb",
  databaseLabel: "LevelDB",
};

describe("custom snapshot catalog visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (listSnapshots as jest.Mock).mockResolvedValue([nginxSnapshot]);
    (listSnapshotsForStoragePrefix as jest.Mock).mockResolvedValue([]);
  });

  it("hides private custom snapshots from other users", async () => {
    (prisma.snapshotRequest.findMany as jest.Mock).mockResolvedValue([completedPrivateRequest]);

    const catalog = await buildSnapshotCatalog("noble-1", {
      id: "stranger-1",
      role: "user",
      tier: "premium",
    });

    expect(catalog).toHaveLength(0);
  });

  it("shows private custom snapshots to the owner", async () => {
    (prisma.snapshotRequest.findMany as jest.Mock).mockResolvedValue([completedPrivateRequest]);

    const catalog = await buildSnapshotCatalog("noble-1", {
      id: "owner-1",
      role: "user",
      tier: "premium",
    });

    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      isCustom: true,
      isOwner: true,
      customVisibility: "private",
      customPublishStatus: "private",
      customSnapshotRequestId: "req-private",
      isRestoreVerified: false,
    });
  });

  it("shows published public custom snapshots as community snapshots", async () => {
    (prisma.snapshotRequest.findMany as jest.Mock).mockResolvedValue([
      {
        ...completedPrivateRequest,
        visibility: "public",
        publishStatus: "published",
        isFeatured: true,
      },
    ]);

    const catalog = await buildSnapshotCatalog("noble-1", {
      id: "stranger-1",
      role: "user",
      tier: "free",
    });

    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      isCustom: true,
      isOwner: false,
      isCommunity: true,
      isFeatured: true,
      customVisibility: "public",
      customPublishStatus: "published",
    });
  });

  it("finds completed custom snapshots in the isolated custom storage prefix", async () => {
    const requestWithoutResult = {
      ...completedPrivateRequest,
      status: "processing",
      processorRequestId: null,
      resultStorageChainId: null,
      resultFileName: null,
      resultFileSizeBytes: null,
      resultHeight: null,
      verifiedAt: null,
    };
    const customSnapshot = {
      ...nginxSnapshot,
      storageChainId: "_custom/noble-1/req-private",
    };

    (listSnapshots as jest.Mock).mockResolvedValue([]);
    (listSnapshotsForStoragePrefix as jest.Mock).mockResolvedValue([customSnapshot]);
    (prisma.snapshotRequest.findMany as jest.Mock)
      .mockResolvedValueOnce([requestWithoutResult])
      .mockResolvedValueOnce([
        {
          ...requestWithoutResult,
          status: "completed",
          resultStorageChainId: "_custom/noble-1/req-private",
          resultFileName: customSnapshot.filename,
          resultFileSizeBytes: BigInt(customSnapshot.size),
          resultHeight: BigInt(customSnapshot.height),
          verifiedAt: new Date("2026-06-14T05:00:00Z"),
          restoreVerifiedAt: null,
        },
      ]);
    (prisma.snapshotRequest.update as jest.Mock).mockResolvedValue({});

    const catalog = await buildSnapshotCatalog("noble-1", {
      id: "owner-1",
      role: "user",
      tier: "premium",
    });

    expect(listSnapshotsForStoragePrefix).toHaveBeenCalledWith("_custom/noble-1/req-private", expect.any(Object));
    expect(prisma.snapshotRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "req-private" },
    }));
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      id: "_custom/noble-1/req-private:noble-1-52756275-20260614-045134.tar.zst",
      storageChainId: "_custom/noble-1/req-private",
      isCustom: true,
      isOwner: true,
    });
  });
});
