"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PolicySettings {
  customSnapshotRetentionHours: number;
  customSnapshotMaxPerUserFree: number;
  customSnapshotMaxPerUserPremium: number;
  customSnapshotMaxPerUserUltra: number;
  customSnapshotGlobalCapGb: number;
}

const FIELDS: { key: keyof PolicySettings; label: string; hint: string; min: number; max: number }[] = [
  { key: "customSnapshotRetentionHours", label: "Retention (hours)", hint: "Custom snapshots are auto-removed after this many hours.", min: 1, max: 720 },
  { key: "customSnapshotMaxPerUserFree", label: "Max per user · free", hint: "Concurrent active custom snapshots for free-tier users.", min: 0, max: 50 },
  { key: "customSnapshotMaxPerUserPremium", label: "Max per user · premium", hint: "Concurrent active custom snapshots for premium users.", min: 0, max: 50 },
  { key: "customSnapshotMaxPerUserUltra", label: "Max per user · ultra", hint: "Concurrent active custom snapshots for ultra users.", min: 0, max: 50 },
  { key: "customSnapshotGlobalCapGb", label: "Global storage cap (GB)", hint: "New requests are refused once hosted custom artifacts exceed this.", min: 1, max: 100000 },
];

export function SettingsManagement() {
  const [settings, setSettings] = useState<PolicySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) throw new Error(json.error || "Failed to load settings");
        setSettings(json.data as PolicySettings);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(key: keyof PolicySettings, value: number) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, reason: "admin settings update" }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save settings");
      }
      setSettings(json.data as PolicySettings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom snapshot policy</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        {loading || !settings ? (
          <div className="py-8 text-sm text-gray-500">Loading settings</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={settings[field.key]}
                    onChange={(event) => update(field.key, Math.trunc(Number(event.target.value)) || 0)}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{field.hint}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving" : "Save settings"}
              </Button>
              {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
