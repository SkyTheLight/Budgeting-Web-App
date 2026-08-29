"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden hero-glow px-4">
      <div className="absolute inset-0 grid-pattern" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          An unexpected error occurred. Try again, or head back to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={reset}
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}