"use client";

import { useState } from "react";
import { Plus, TrendingUp, Wallet, Home, Car, Briefcase, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAsset, deleteAsset } from "@/actions/assetActions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// interface Asset {
//   id: string;
//   name: string;
//   type: string;
//   value: number;
// }

const typeIcons: Record<string, typeof Coins> = {
  cash: Coins,
  investment: TrendingUp,
  property: Home,
  vehicle: Car,
  other: Briefcase,
};

const typeColors: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  investment: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  property: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  vehicle: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-muted text-muted-foreground",
};

interface AssetListProps {
  assets: { id: string; name: string; type: string; value: number }[];
}

export function AssetList({ assets }: AssetListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !value) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await createAsset({ name, type, value: parseFloat(value) });
      toast.success("Asset added");
      setName("");
      setValue("");
      setShowForm(false);
    } catch (_err) {
      toast.error("Failed to add asset");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    try {
      await deleteAsset(id);
      toast.success("Asset deleted");
    } catch (_err) {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Asset
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" />
          </div>
          <div>
            <Label>Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            >
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
              <option value="property">Property</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>Save</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No assets yet. Add your first asset!</p>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => {
            const Icon = typeIcons[asset.type] || Wallet;
            return (
              <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[asset.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{asset.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(asset.value)}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)} className="text-muted-foreground hover:text-rose-500">
                    ×
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}