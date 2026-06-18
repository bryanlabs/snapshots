"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SettingsManagement } from "@/components/admin/SettingsManagement";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading</div>;
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-gray-600">Admin access is required.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tune custom snapshot retention and per-tier quotas. Changes apply immediately to new requests.
        </p>
      </div>
      <SettingsManagement />
    </div>
  );
}
