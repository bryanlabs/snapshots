"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { SparklesIcon, RocketLaunchIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface CustomSnapshotModalProps {
  chainId: string;
  chainName: string;
}

export function CustomSnapshotModal({ chainId, chainName }: CustomSnapshotModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetHeight: "latest",
    customHeight: "",
    compressionType: "zstd",
    compressionLevel: 15,
    retentionDays: 30,
  });
  const [showCompressionInfo, setShowCompressionInfo] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.targetHeight === "custom" && !formData.customHeight) {
      showToast("Please enter a block height", "error");
      return;
    }

    // Compression type is always selected, no need to check

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
          isPrivate: false,
          scheduleType: "once",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create snapshot request");
      }

      showToast("🚀 Custom snapshot request created! We'll process it right away.", "success");
      setOpen(false);
      
      // Reset form
      setFormData({
        targetHeight: "latest",
        customHeight: "",
        compressionType: "zstd",
        compressionLevel: 15,
        retentionDays: 30,
      });
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
            <div className="p-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg">
              <RocketLaunchIcon className="w-6 h-6 text-purple-400" />
            </div>
            Custom Snapshot for {chainName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Block Height */}
          <div className="space-y-3">
            <Label className="text-gray-300">Block Height</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="latest"
                  checked={formData.targetHeight === "latest"}
                  onChange={(e) => setFormData({ ...formData, targetHeight: e.target.value })}
                  className="text-purple-500"
                />
                <span className="text-gray-300">Latest available height</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="custom"
                  checked={formData.targetHeight === "custom"}
                  onChange={(e) => setFormData({ ...formData, targetHeight: e.target.value })}
                  className="text-purple-500"
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
                    <span className="text-purple-400 font-medium">ZST - Recommended</span>
                    <p className="text-gray-400">Best compression (60-70% smaller). Uses 24 threads for fast creation. Great decompression speed.</p>
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
                    ? "bg-purple-600 text-white border-2 border-purple-400"
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
                  max="15"
                  value={formData.compressionLevel}
                  onChange={(e) => setFormData({ ...formData, compressionLevel: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Fastest (0)</span>
                  <span>Balanced (10)</span>
                  <span>Best (15)</span>
                </div>
                <p className="text-xs text-gray-400">
                  Level {formData.compressionLevel}: 
                  {formData.compressionLevel === 0 && " Fastest compression, ~50% size reduction"}
                  {formData.compressionLevel > 0 && formData.compressionLevel <= 3 && " Fast compression, ~55% size reduction"}
                  {formData.compressionLevel > 3 && formData.compressionLevel <= 10 && " Balanced speed/ratio, ~60% size reduction"}
                  {formData.compressionLevel > 10 && formData.compressionLevel <= 13 && " Good compression, ~65% size reduction"}
                  {formData.compressionLevel > 13 && formData.compressionLevel <= 15 && " Maximum compression, ~70% size reduction"}
                </p>
              </div>
            </div>
          )}


          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <RocketLaunchIcon className="w-4 h-4 mr-2 animate-pulse" />
                Creating Request...
              </>
            ) : (
              <>
                <RocketLaunchIcon className="w-4 h-4 mr-2" />
                Create Custom Snapshot
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}