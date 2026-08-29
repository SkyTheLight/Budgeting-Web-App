import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden hero-glow px-4">
      <div className="absolute inset-0 grid-pattern" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">404</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Page not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className={buttonVariants({ variant: "default", size: "lg" })}>
          Back to home
        </Link>
      </div>
    </div>
  );
}