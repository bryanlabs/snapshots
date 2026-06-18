"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { SparklesIcon, QuestionMarkCircleIcon, LockClosedIcon, GlobeAltIcon, ClockIcon, ServerStackIcon } from "@heroicons/react/24/outline";

interface CustomSnapshotModalProps {
  chainId: string;
  chainName: string;
  chainLogoUrl?: string;
}

interface QuotaInfo {
  retentionHours: number;
  maxConcurrent: number;
  activeCount: number;
  atUserLimit: boolean;
  overGlobalCap: boolean;
  canCreate: boolean;
}

const defaultFormData = {
  targetHeight: "custom",
  customHeight: "",
  compressionType: "zstd",
  compressionLevel: 12,
  retentionDays: 1,
  visibility: "private",
  note: "",
};

export function CustomSnapshotModal({ chainId, chainName, chainLogoUrl }: CustomSnapshotModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [showCompressionInfo, setShowCompressionInfo] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/account/snapshots/quota")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setQuota(data.data as QuotaInfo);
      })
      .catch(() => {
        /* non-fatal: the modal still works, server enforces on submit */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const retentionHours = quota?.retentionHours ?? 24;
  const maxConcurrent = quota?.maxConcurrent ?? 1;
  const blockedReason = quota && !quota.canCreate
    ? quota.overGlobalCap
      ? "Custom snapshot storage is temporarily full. Please try again after some snapshots expire."
      : `You already have ${quota.activeCount} of ${maxConcurrent} custom snapshot${maxConcurrent === 1 ? "" : "s"}. Delete one or wait for it to expire.`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.targetHeight === "custom" && !formData.customHeight) {
      showToast("Please enter a block height", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/account/snapshots/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId,
          targetHeight: formData.targetHeight === "latest" ? 0 : parseInt(formData.customHeight),
          compressionType: formData.compressionType,
          compressionLevel: formData.compressionType === "zstd" ? formData.compressionLevel : undefined,
          retentionDays: formData.retentionDays,
          isPrivate: formData.visibility !== "public",
          visibility: formData.visibility,
          sharePublicly: formData.visibility === "public",
          note: formData.note.trim() || undefined,
          scheduleType: "once",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create snapshot request");
      }

      showToast("Custom snapshot request created. We'll process it right away.", "success");
      setOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create snapshot request", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
          <SparklesIcon className="w-5 h-5 mr-2" />
          Custom Snapshot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-800">
              {chainLogoUrl ? (
                <Image
                  src={chainLogoUrl}
                  alt={`${chainName} logo`}
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              ) : (
                <ServerStackIcon className="h-6 w-6 text-blue-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span>Custom snapshot</span>
              <span className="text-sm font-normal text-gray-400">{chainName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Block Height - defaults to a specific height */}
          <div className="space-y-3">
            <Label className="text-gray-300">Block Height</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="custom"
                  checked={formData.targetHeight === "custom"}
                  onChange={(e) => setFormData({ ...formData, targetHeight: e.target.value })}
                  className="text-blue-500"
                />
                <span className="text-gray-300">Specific height</span>
              </label>
              {formData.targetHeight === "custom" && (
                <Input
                  type="number"
                  placeholder="Enter block height"
                  value={formData.customHeight}
                  onChange={(e) => setFormData({ ...formData, customHeight: e.target.value })}
                  className="ml-6 bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="latest"
                  checked={formData.targetHeight === "latest"}
                  onChange={(e) => setFormData({ ...formData, targetHeight: e.target.value })}
                  className="text-blue-500"
                />
                <span className="text-gray-300">Latest available height</span>
              </label>
            </div>
          </div>

          {/* Compression Format */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-gray-300">Compression Format</Label>
              <button
                type="button"
                onClick={() => setShowCompressionInfo(!showCompressionInfo)}
                className="text-gray-400 hover:text-gray-300"
              >
                <QuestionMarkCircleIcon className="w-4 h-4" />
              </button>
            </div>

            {showCompressionInfo && (
              <div className="mb-3 p-3 bg-gray-800/50 rounded-lg text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-400 font-medium">ZST - Recommended</span>
                    <p className="text-gray-400">Standard Bryanlabs compression, normally level 12. Strong compression with good restore-time decompression speed.</p>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">LZ4</span>
                    <p className="text-gray-400">Moderate compression (40-50% smaller). Single-threaded (slower to create). Fastest decompression.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, compressionType: "zstd" })}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  formData.compressionType === "zstd"
                    ? "bg-blue-600 text-white border-2 border-blue-400"
                    : "bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                ZST
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, compressionType: "lz4" })}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  formData.compressionType === "lz4"
                    ? "bg-blue-600 text-white border-2 border-blue-400"
                    : "bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                LZ4
              </button>
            </div>
          </div>

          {/* Compression Level for ZSTD */}
          {formData.compressionType === "zstd" && (
            <div>
              <Label className="text-gray-300">
                Compression Level: {formData.compressionLevel}
              </Label>
              <div className="mt-2 space-y-2">
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={formData.compressionLevel}
                  onChange={(e) => setFormData({ ...formData, compressionLevel: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Fastest (0)</span>
                  <span>Balanced (6)</span>
                  <span>Standard (12)</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-gray-300">Visibility</Label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: "private" })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  formData.visibility === "private"
                    ? "border-blue-400 bg-blue-950/40 text-white"
                    : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <LockClosedIcon className="h-4 w-4" />
                  Private to my account
                </div>
                <div className="mt-1 text-xs text-gray-400">Shown in your account and signed only for you or admins.</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: "public" })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  formData.visibility === "public"
                    ? "border-blue-400 bg-blue-950/40 text-white"
                    : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <GlobeAltIcon className="h-4 w-4" />
                  Share with community
                </div>
                <div className="mt-1 text-xs text-gray-400">Listed for everyone on the chain page when the snapshot is ready.</div>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Note</Label>
            <textarea
              value={formData.note}
              onChange={(event) => setFormData({ ...formData, note: event.target.value })}
              maxLength={500}
              rows={3}
              placeholder="Optional context for yourself or the community"
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Retention / quota caveat */}
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <ClockIcon className="h-5 w-5 flex-shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-200/90">
              Custom snapshots are removed automatically after{" "}
              <span className="font-semibold">{retentionHours} hours</span>, and you can have{" "}
              <span className="font-semibold">{maxConcurrent}</span> at a time.
              {quota && (
                <> You have {quota.activeCount} of {maxConcurrent} active.</>
              )}
            </p>
          </div>

          {blockedReason && (
            <p className="text-xs text-red-400">{blockedReason}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || (quota ? !quota.canCreate : false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                Creating Request...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Create Custom Snapshot
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
