"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function fieldClasses(): string {
  return cn(
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );
}

export function BackupExport() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/backup/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data: { encrypted?: string; error?: string } = await response.json();
      if (!response.ok || !data.encrypted) throw new Error(data.error || "Export failed");

      const blob = new Blob([data.encrypted], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budgetpro-backup-${new Date().toISOString().split("T")[0]}.bkb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <label htmlFor="export-password" className="text-sm font-medium">
        Encryption Password
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="export-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={cn(fieldClasses(), "pl-9")}
          />
        </div>
        <button
          onClick={handleExport}
          disabled={loading || !password}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  );
}

export function BackupImport() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !password) {
      toast.error("Please select a file and enter password");
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      const response = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedData: text, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Import failed");
      toast.success("Data imported successfully");
      e.target.value = "";
      setPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <label htmlFor="import-password" className="text-sm font-medium">
        Import Backup
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="import-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter backup password"
            className={cn(fieldClasses(), "pl-9")}
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50">
          <Upload className="h-4 w-4" />
          Import
          <input
            ref={fileRef}
            type="file"
            accept=".bkb"
            onChange={handleImport}
            disabled={loading || !password}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Warning: Import will replace all existing data</p>
    </div>
  );
}

export function BackupManager() {
  return (
    <div className="space-y-6">
      <BackupExport />
      <BackupImport />
      <p className="text-xs text-muted-foreground">
        Backups are encrypted with AES-256-GCM using your password and restored only with the correct password.
      </p>
    </div>
  );
}