function processorUrl() {
  return process.env.SNAPSHOT_PROCESSOR_URL || "http://snapshot-processor:8080";
}

export async function updateProcessorCustomSnapshotVisibility(input: {
  chainId: string;
  appRequestId: string;
  visibility: "private" | "public";
  publishStatus: "private" | "pending_review" | "published" | "rejected";
}) {
  const response = await fetch(`${processorUrl()}/api/v1/custom-snapshots/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain_id: input.chainId,
      app_request_id: input.appRequestId,
      visibility: input.visibility,
      publish_status: input.publishStatus,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Snapshot metadata update failed: ${message}`);
  }

  return response.json();
}
