"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Wallet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      setIsLoading(false);
      let errorMsg = "Failed to register";
      try {
        const result = await res.json();
        errorMsg = result?.error ?? errorMsg;
      } catch {
        // Ignore JSON parse errors
      }
      toast.error(errorMsg);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (signInResult?.error) {
      toast.success("Registration successful! Please sign in.");
      router.push("/auth/login");
      return;
    }

    toast.success("Welcome to BudgetPro!");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden hero-glow">
      <div className="absolute inset-0 grid-pattern" aria-hidden="true" />
      
      <Card className="w-full max-w-md relative z-10 glass gradient-border animate-fade-in">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Create an account</CardTitle>
          <p className="text-sm text-muted-foreground">Start your financial journey with us</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                required 
                className="bg-secondary/50 border-border focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                className="bg-secondary/50 border-border focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                minLength={8}
                placeholder="Min 8 characters"
                className="bg-secondary/50 border-border focus:border-primary focus:ring-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">Already have an account?</span>
          <Link href="/auth/login" className="ml-1 font-medium text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
