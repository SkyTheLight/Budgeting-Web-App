"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/actions/onboardingActions";
import { toast } from "sonner";

export function DemoDataBanner({ userName }: { userName: string }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (dismissed || done) return null;

  async function handleLoad() {
    setLoading(true);
    try {
      const { created } = await loadDemoData();
      if (created > 0) {
        toast.success(`Loaded ${created} sample transactions`);
        setDone(true);
        router.refresh();
      } else {
        toast.info("Your ledger is no longer empty — nothing to load");
        setDone(true);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load demo data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background p-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">
            {userName ? `Welcome, ${userName}!` : "Welcome!"} Your workspace is ready.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with a budget, log an expense, or load a realistic 3-month sample so every
            chart and report works immediately.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleLoad} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
                </>
              ) : (
                "Load sample data"
              )}
            </Button>
            <a href="/transactions">
              <Button variant="outline" size="sm">Add your own transaction</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}