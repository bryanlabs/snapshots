"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tier = {
  id: string;
  name: "free" | "premium" | "ultra";
  displayName: string;
  bandwidthMbps: number;
};

type AdminUser = {
  id: string;
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
  role: "user" | "admin";
  subscriptionStatus: "free" | "active" | "cancelled" | "expired" | "pending";
  subscriptionExpiresAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  personalTier: Tier | null;
  _count: {
    downloads: number;
    snapshotRequests: number;
  };
};

type Draft = {
  role: "user" | "admin";
  tier: "free" | "premium" | "ultra";
  subscriptionStatus: "free" | "active" | "cancelled" | "expired" | "pending";
  subscriptionExpiresAt: string;
};

type AuditLog = {
  id: string;
  adminUserId: string | null;
  targetUserId: string | null;
  action: string;
  reason: string | null;
  createdAt: string;
};

const subscriptionStatuses = ["free", "active", "cancelled", "expired", "pending"] as const;

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toIsoOrNull(value: string) {
  if (!value) return null;
  return new Date(`${value}T23:59:59.000Z`).toISOString();
}

function userLabel(user: AdminUser) {
  return user.email || user.walletAddress || user.displayName || user.id;
}

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userCountByTier = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, user) => {
      const tier = user.personalTier?.name || "free";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  async function loadUsers(search = query) {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, auditResponse] = await Promise.all([
        fetch(`/api/admin/users?q=${encodeURIComponent(search)}`, { cache: "no-store" }),
        fetch("/api/admin/audit?limit=12", { cache: "no-store" }),
      ]);

      const usersJson = await usersResponse.json();
      const auditJson = await auditResponse.json();

      if (!usersResponse.ok || !usersJson.success) {
        throw new Error(usersJson.error || "Failed to load users");
      }

      setUsers(usersJson.data.users);
      setTiers(usersJson.data.tiers);
      setAuditLogs(auditJson.success ? auditJson.data : []);
      setDrafts(Object.fromEntries(usersJson.data.users.map((user: AdminUser) => [
        user.id,
        {
          role: user.role,
          tier: user.personalTier?.name || "free",
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiresAt: toDateInput(user.subscriptionExpiresAt),
        },
      ])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(userId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }));
  }

  async function saveUser(user: AdminUser) {
    const draft = drafts[user.id];
    if (!draft) return;

    setSavingUserId(user.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: draft.role,
          tier: draft.tier,
          subscriptionStatus: draft.subscriptionStatus,
          subscriptionExpiresAt: toIsoOrNull(draft.subscriptionExpiresAt),
          reason: "admin user management",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save user");
      }

      await loadUsers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {["free", "premium", "ultra"].map((tier) => (
          <Card key={tier}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{tier}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{userCountByTier[tier] || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Users</CardTitle>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              loadUsers(query);
            }}
          >
            <div className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
              />
            </div>
            <Button type="submit" variant="outline" size="icon" aria-label="Search users">
              <Search className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => loadUsers(query)} aria-label="Refresh users">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="py-8 text-sm text-gray-500">Loading users</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">Identity</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Expires</th>
                    <th className="py-2 pr-3">Activity</th>
                    <th className="py-2 pr-3 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => {
                    const draft = drafts[user.id];
                    return (
                      <tr key={user.id} className="align-top">
                        <td className="max-w-[320px] py-3 pr-3">
                          <div className="truncate font-medium">{userLabel(user)}</div>
                          <div className="truncate font-mono text-xs text-gray-500">{user.walletAddress || user.id}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={draft?.role || user.role}
                            onChange={(event) => updateDraft(user.id, { role: event.target.value as Draft["role"] })}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={draft?.tier || user.personalTier?.name || "free"}
                            onChange={(event) => updateDraft(user.id, { tier: event.target.value as Draft["tier"] })}
                          >
                            {tiers.map((tier) => (
                              <option key={tier.id} value={tier.name}>{tier.displayName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={draft?.subscriptionStatus || user.subscriptionStatus}
                            onChange={(event) => updateDraft(user.id, { subscriptionStatus: event.target.value as Draft["subscriptionStatus"] })}
                          >
                            {subscriptionStatuses.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <Input
                            type="date"
                            value={draft?.subscriptionExpiresAt || ""}
                            onChange={(event) => updateDraft(user.id, { subscriptionExpiresAt: event.target.value })}
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{user._count.downloads} downloads</Badge>
                            <Badge variant="outline">{user._count.snapshotRequests} requests</Badge>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => saveUser(user)}
                            disabled={savingUserId === user.id}
                            aria-label={`Save ${userLabel(user)}`}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-b-0">
                <div>
                  <span className="font-medium">{log.action}</span>
                  <span className="ml-2 font-mono text-xs text-gray-500">{log.targetUserId}</span>
                </div>
                <time className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</time>
              </div>
            ))}
            {auditLogs.length === 0 && <div className="text-gray-500">No changes recorded</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
