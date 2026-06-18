"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminUsersPage() {
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
      </div>
      <UserManagement />
    </div>
  );
}
