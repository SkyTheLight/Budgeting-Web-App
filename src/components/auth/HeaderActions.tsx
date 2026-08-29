"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";

async function getCsrfToken() {
  const res = await fetch("/api/auth/csrf");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.csrfToken ?? null;
}

export function HeaderActions() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      )}
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
          router.refresh();
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}