import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wallet, TrendingUp, PiggyBank, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden hero-glow">
      <div className="absolute inset-0 grid-pattern" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6 backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Encrypted, private, free
        </span>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <Wallet className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
          Budget<span className="text-gradient">Pro</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-4">
          Track income, manage budgets, and reach your savings goals with powerful analytics — all in one place.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mb-10 w-full">
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur">
            <TrendingUp className="h-6 w-6 text-emerald-500 mb-2" />
            <span className="text-sm font-medium">Track Income</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur">
            <PiggyBank className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Budgets & Goals</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur">
            <BarChart3 className="h-6 w-6 text-amber-500 mb-2" />
            <span className="text-sm font-medium">Analytics</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/login" className={buttonVariants({ variant: "default", size: "lg" })}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/auth/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}