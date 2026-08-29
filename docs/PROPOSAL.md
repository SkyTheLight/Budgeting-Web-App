# Budgeting Web App - Project Proposal

## 1. Problem Statement

Personal finance management is a critical life skill, yet many individuals struggle to track their income, expenses, and savings effectively. Without proper tracking, users face difficulties in:

- Understanding spending patterns
- Meeting savings goals
- Staying within monthly budgets
- Making informed financial decisions

This project aims to provide a comprehensive, user-friendly budgeting application that enables individuals to track transactions, manage budgets, set savings goals, and gain insights into their financial health.

## 2. Project Goals

### Primary Objectives

1. **Transaction Management** - Allow users to record income and expenses with categories
2. **Budget Tracking** - Enable users to set monthly budgets per category and track progress
3. **Savings Goals** - Help users set and track progress toward savings targets
4. **Financial Analytics** - Provide visual charts showing spending patterns and trends
5. **AI Assistance** - Include an AI chatbot to provide financial advice

### Secondary Objectives

1. **Data Export** - Allow users to export data for external analysis
2. **Search & Filter** - Enable searching and filtering transactions by date/category
3. **Responsive Design** - Ensure the app works on mobile and desktop devices

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Budgeting Web App                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend  │◄──►│  Next.js   │◄──►│   Backend   │     │
│  │  (React)   │    │   Server   │    │  (API)      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                    │              │
│         │                  ┌────────────────┴──────────┐   │
│         │                  │                          │   │
│         ▼                  ▼                          ▼   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  UI Components│    │  Actions   │    │  Database   │    │
│  │  (shadcn)   │    │  (Server)  │    │  (Prisma)   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                           │                               │
│                           ▼                               │
│                    ┌─────────────┐                        │
│                    │  Next-Auth │                        │
│                    │  (JWT)     │                        │
│                    └─────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **User → Frontend** - User interacts with React components (forms, charts, tables)
2. **Frontend → Next.js Server** - Server Actions make API calls
3. **Next.js → Database** - Prisma ORM communicates with SQLite database
4. **Authentication** - Next-Auth handles JWT-based authentication

### Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Frontend | React + Next.js 13 | Server-side rendering, SEO-friendly |
| Styling | Tailwind CSS | Rapid UI development, consistent design |
| UI Components | shadcn/ui | Accessible, customizable components |
| Backend | Next.js API Routes | Unified full-stack framework |
| Database | SQLite + Prisma | Easy setup, no external DB required |
| Authentication | Next-Auth | Secure, flexible auth solution |
| Charts | Recharts | React-native charting library |
| Validation | Zod | Type-safe schema validation |

### Design Decisions

1. **Monolithic vs Microservices** - Chose monolithic for simplicity and faster development
2. **REST vs GraphQL** - Used Server Actions (Next.js) for simpler data fetching
3. **SQL vs NoSQL** - SQLite with Prisma for type-safe database operations
4. **JWT vs Sessions** - JWT for stateless authentication

## 4. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│    User      │       │  Transaction    │       │   Budget    │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ id (PK)     │◄──────│ userId (FK)     │       │ id (PK)     │
│ email       │       │ id (PK)         │       │ userId (FK) │
│ name        │       │ type            │       │ category     │
│ password    │       │ amount          │       │ month        │
│ createdAt   │       │ description     │       │ amount       │
│ updatedAt   │       │ category        │       │ createdAt    │
└──────────────┘       │ date           │       │ updatedAt    │
        │              │ createdAt      │       └──────────────┘
        │              │ updatedAt      │              │
        └─────────────►└─────────────────┘              │
                         Transaction                    │
                         Budget                        │
                                                        │
                         ┌─────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │SavingsGoal  │
                  ├──────────────┤
                  │ id (PK)     │
                  │ userId (FK) │
                  │ name        │
                  │ targetAmount│
                  │ currentAmount
                  │ deadline    │
                  │ completed   │
                  │ createdAt   │
                  │ updatedAt   │
                  └──────────────┘
```

## 5. Security Architecture

### Implemented Security Features

1. **Authentication** - JWT-based with bcrypt password hashing
2. **Authorization** - User-scoped data access (userId filtering)
3. **Input Validation** - Zod schema validation with sanitization
4. **Rate Limiting** - 5 attempts per 15 minutes on auth endpoints
5. **Security Headers** - CSP, X-Frame-Options, X-Content-Type-Options
6. **Session Timeout** - 30-minute session expiration

### Data Flow Security

```
User Login Request
       │
       ▼
┌──────────────────┐
│ Rate Limiter     │ ──► Block if >5 attempts
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Validate Input   │ ──► Zod schema
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Authenticate     │ ──► bcrypt compare
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Create JWT       │ ──► 30-min expiry
└──────────────────┘
       │
       ▼
   Authenticated
```

## 6. API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | POST | User login |
| `/api/auth/signout` | POST | User logout |
| `/api/auth/register` | POST | User registration |

### Transactions (Server Actions)

| Function | Description |
|----------|-------------|
| `createTransaction` | Add new transaction |
| `updateTransaction` | Update existing transaction |
| `deleteTransaction` | Remove transaction |

### Budgets (Server Actions)

| Function | Description |
|----------|-------------|
| `upsertBudget` | Create/update budget |
| `deleteBudget` | Remove budget |

### Savings Goals (Server Actions)

| Function | Description |
|----------|-------------|
| `createSavingsGoal` | Create savings goal |
| `updateSavingsGoal` | Update savings goal |
| `addToSavingsGoal` | Add money to goal |
| `deleteSavingsGoal` | Remove savings goal |

## 7. Acceptance Criteria

### Authentication
- [ ] Users can register with email/password
- [ ] Users can log in securely
- [ ] JWT tokens expire after 30 minutes
- [ ] Rate limiting prevents brute force attacks

### Transactions
- [ ] Users can add income/expense transactions
- [ ] Transactions are categorized
- [ ] Users can search/filter transactions
- [ ] Users can export transactions to CSV

### Budgets
- [ ] Users can set monthly budgets per category
- [ ] Budget progress is visualized
- [ ] Warnings shown when approaching/exceeding budget

### Savings Goals
- [ ] Users can create savings goals with targets
- [ ] Progress is tracked visually
- [ ] Goals can be marked complete

### Analytics
- [ ] Pie chart shows expense breakdown
- [ ] Bar chart shows income vs expense trends
- [ ] Savings trend chart shows monthly savings
- [ ] Summary cards show key metrics

### Security
- [ ] All endpoints require authentication
- [ ] Users can only access their own data
- [ ] Passwords are hashed with bcrypt
- [ ] Security headers are applied
- [ ] Rate limiting is enforced

### UI/UX
- [ ] Responsive design works on mobile/desktop
- [ ] Loading states shown during data fetch
- [ ] Forms validate input with clear error messages
- [ ] AI chatbot provides financial advice

## 8. Engineering Practices Reflection

### Week 1 - Requirements & Architecture
- **What worked well**: Clear requirements gathering with stakeholder alignment on core features. Architecture diagrams helped visualize the full-stack integration.
- **Challenges**: Balancing feature scope with academic timeline. Monolithic architecture was chosen for simplicity.
- **Trade-offs made**: Chose Next.js App Router over traditional REST API for simpler server-client data flow.

### Week 2 - Database & Authentication
- **What worked well**: Prisma ORM provided type-safe database operations. JWT-based auth with bcrypt ensured secure password handling.
- **Challenges**: SQLite composite key limitations required refactoring budget upsert logic.
- **Security implemented**: Rate limiting (5 attempts/15 min), security headers, session timeout (30 min).

### Week 3 - Core Features (CRUD)
- **What worked well**: Server Actions provided clean separation between UI and backend logic. Zod validation caught input errors early.
- **Challenges**: Handling server-side form validation with clear user feedback.
- **Error handling**: Implemented try-catch blocks with proper error logging.

### Week 4 - Analytics & Notifications
- **What worked well**: Recharts provided responsive, animated visualizations. Budget warnings alert users in real-time.
- **Extensibility**: Modular component design allows easy addition of new chart types or notification channels.
- **Event-driven elements**: Transaction creation triggers budget limit checks.

### Week 5 - Testing & CI/CD
- **What worked well**: Vitest with 100% coverage on utility functions. GitHub Actions automated build and test pipeline.
- **Test coverage**: 19 passing tests covering utils.ts and validation logic.
- **CI/CD**: Pipeline runs lint, build, and tests on every push.

### Week 6 - Final Integration & Documentation
- **Maintainability**: Clean component structure, TypeScript types throughout, consistent code style.
- **Scalability considerations**: Prisma easily migrates to PostgreSQL for production. Next.js supports easy Vercel deployment.
- **Lessons learned**: 
  1. Early security planning (rate limiting, headers) prevented later refactoring
  2. Server Actions simplified full-stack development but require careful client-server boundary management
  3. Comprehensive documentation (API, architecture) significantly aids debugging and onboarding

### Non-Functional Requirements Addressed
- **Performance**: Server-side rendering, optimized database queries, minimal client-side JavaScript
- **Security**: JWT auth, bcrypt hashing, input validation, rate limiting, security headers
- **Usability**: Responsive design, clear error messages, loading states, intuitive navigation
- **Maintainability**: TypeScript, modular components, comprehensive documentation
