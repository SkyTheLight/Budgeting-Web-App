import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "BudgetPro";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_NAME} — Personal Finance & Budgeting`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Track income and expenses, plan budgets, set savings goals, manage debt and bills, and get AI-powered financial insights — all in one private dashboard.",
  keywords: [
    "budget",
    "budgeting",
    "personal finance",
    "expense tracker",
    "savings goals",
    "debt tracker",
    "financial analytics",
    "philippines",
  ],
  applicationName: APP_NAME,
  authors: [{ name: "BudgetPro" }],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Personal Finance & Budgeting`,
    description:
      "Track income and expenses, plan budgets, set savings goals, manage debt and bills, and get AI-powered financial insights.",
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} — Personal Finance & Budgeting`,
    description:
      "Track income and expenses, plan budgets, set savings goals, and get AI-powered financial insights.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
          enableSystem={false}
          attribute="data-theme"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}