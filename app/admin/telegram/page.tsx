"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TelegramGroupManagement } from "@/components/admin/TelegramGroupManagement";

export default function AdminTelegramPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated or not admin
  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Check if user is admin (this should also be enforced by the API)
  if (session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin: Telegram Groups</h1>
        <p className="text-gray-600">
          Manage Telegram group invitations and track community membership
        </p>
      </div>
      
      <TelegramGroupManagement />
    </div>
  );
}