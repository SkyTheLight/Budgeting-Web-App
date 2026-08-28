# Budgeting Web App (Next.js + Prisma + Auth.js)

A personal finance tracker / budgeting MVP built with:

- Next.js (App Router) + TypeScript
- Tailwind CSS + Shadcn/ui components
- Prisma ORM + PostgreSQL
- Auth.js (NextAuth v5) with Credentials provider
- Recharts for charts
- Zod for validation
- Sonner for toast notifications
- Server Actions for mutations

---

## 🛠️ Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Environment Variables

Create a `.env` file at project root with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="a-very-secret-value"
NEXTAUTH_URL="http://localhost:3000"
```

### 2a) Install PostgreSQL (Windows)

1. Download and install PostgreSQL from EnterpriseDB:
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

```cmd
setx PATH "%PATH%;C:\Program Files\PostgreSQL\18\bin" /M
```

3. Restart your terminal after updating PATH.

### 3) Prisma Setup

Generate the Prisma client and apply migrations to your database:

```bash
npx prisma generate
npx prisma migrate dev
```

> If you want to run the migration without applying it, use:
> `npx prisma migrate dev --name init --create-only`

### 4) Start Dev Server

```bash
npm run dev
```

By default the app will run at `http://localhost:3000`.
If port 3000 is already in use, Next.js will automatically try the next free port (e.g., `http://localhost:3001`).

---

## ✅ Features

- Register / Login (email + password w/ bcrypt)
- Protected dashboard routes
- CRUD transactions + budgets
- Analytics (pie + bar charts)
- Budget progress + warnings
- Toast notifications via Sonner