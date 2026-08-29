"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

async function getCsrfToken() {
  const res = await fetch("/api/auth/csrf");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.csrfToken ?? null;
}

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const csrfToken = await getCsrfToken();
        const body = new URLSearchParams();
        if (csrfToken) body.set("csrfToken", csrfToken);
        body.set("callbackUrl", "/auth/login");

        await fetch("/api/auth/signout", {
          method: "POST",
          body,
        });

        router.push("/auth/login");
      }}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
}
