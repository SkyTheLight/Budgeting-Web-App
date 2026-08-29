# BudgetPro - Personal Finance App

A full-stack personal finance management application with budgeting, savings tracking, analytics, and AI-powered assistance.

## Features

### Core
- **Authentication** - Secure register/login with JWT sessions (30-min timeout)
- **Transactions** - Income/expense tracking with categories, search & date filters
- **Budgets** - Monthly budgets per category with progress tracking
- **Savings Goals** - Goals with targets, deadlines, progress tracking
- **Bill Reminders** - Recurring bills; marking paid also records the expense transaction
- **Debt Tracking** - Manage debts with progress and one-tap payments
- **Assets** - Track cash, investments, property, vehicles
- **CSV Export** - Export the visible transactions (formula-injection safe)

### Analytics
- Expense Pie Chart
- Income vs Expense Bar Chart
- Savings Trend Chart
- Weekly Spending Chart
- Month Comparison Chart
- Balance Forecast Chart (3-month projection)
- Summary Cards (Income, Expenses, Net Balance, Savings Rate)

### AI Features
- **AI Assistant** - Context-aware chatbot for financial advice (budgeting, saving, debt, investing, taxes). It uses your real financial snapshot (income, expenses, budget overruns, savings progress) when answering.
- **AI Goal Suggestions** - Personalized recommendations based on financial data

### Financial Tools
- **Net Worth Calculator** - Total assets minus liabilities with breakdown
- **Financial Health Score** - Gamified scoring (savings rate, budget compliance, debt, emergency fund, goals)
- **Spending Alerts** - Notifications when approaching budget limits
- **Financial Report** - Downloadable summary for the current month, last month, or year

### Data
- **Data Backup/Import** - AES-256-GCM encrypted exports, password-protected, transactional restore

### UI/UX
- **Theme Toggle** - Dark/light mode (persisted, next-themes)
- **Responsive** - Mobile-friendly layout with skeleton loading states

### Security
- JWT authentication with bcrypt (12 rounds)
- Server-side authorization on every mutation (session-scoped, ownership-checked)
- Rate limiting on auth & backup endpoints (5 attempts / 15 min)
- Security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Input validation with Zod on both client and server
- Encrypted backups restore transactionally

## Tech Stack

Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, NextAuth v4, Recharts, Sonner, React Hook Form + Zod, Vitest

## Quick Start (Local Development)

```bash
npm install
npx prisma generate
```

Create `.env` (see `.env.example`):
```
DATABASE_URL="postgresql://user:password@localhost:5432/budgetpro"
NEXTAUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Migrate the schema and seed a demo user:
```bash
npx prisma db push
npx prisma db seed        # or: node prisma/seed.ts (SEED_EMAIL / SEED_PASSWORD env vars override defaults)
```

```bash
npm run dev
```

> The app requires PostgreSQL. For production, use a hosted database such as
> Neon or Vercel Postgres and set `DATABASE_URL` to its pooled connection string.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run test` | Run tests (watch) |
| `npm run test:coverage` | Run tests with coverage |
| `npx prisma studio` | Database GUI |
| `npx tsc --noEmit` | Type check |

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs lint, type check, unit
tests, and a production build on every push/PR to `main`. On merges to `main`
it deploys to Vercel via `amondnet/vercel-action`.

Required GitHub secrets:

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Production PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Long random string for session encryption |
| `NEXTAUTH_URL` | Production URL (e.g., `https://your-project.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Production URL (same as NEXTAUTH_URL) |
| `VERCEL_TOKEN` | Vercel access token |
| `VERCEL_ORG_ID` | Vercel team/org id |
| `VERCEL_PROJECT_ID` | Vercel project id |

## Deployment

- **Platform**: Vercel (recommended)
- **Build Command**: `npm run vercel-build` (runs `prisma generate && next build`)
- **Output Directory**: `.next`

### Environment Variables (Vercel)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (use pooled Neon/Vercel Postgres) |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `NEXTAUTH_URL` | Production URL (e.g., `https://your-project.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Production URL (used for sitemap/robots metadata) |

## License

MIT