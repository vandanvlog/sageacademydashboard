# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sage Academy Financial Dashboard — a full-stack web app for tracking income, expenses, and course-level financials for an education business. It has a Node.js/Express backend with MySQL and a React/Vite frontend.

## Commands

### Database (run once, from `sage-academy/` directory)

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
node backend/database/seed.js   # creates admin user with bcrypt hash
```

### Backend (`sage-academy/backend/`)

```bash
npm install
cp .env.example .env            # then edit with DB creds + JWT_SECRET
npm run dev                     # nodemon, auto-restarts on change
npm start                       # production
```

Backend: http://localhost:5000 — health check: http://localhost:5000/api/health

### Frontend (`sage-academy/frontend/`)

```bash
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:5000/api
npm run dev                     # Vite dev server
npm run build                   # production build
npm run preview                 # preview production build
```

Frontend: http://localhost:5173

### Default login

| Email | Password | Role |
|-------|----------|------|
| admin@sageacademy.com | Admin123! | admin |

## Architecture

### Backend (`sage-academy/backend/`)

Express app (`server.js`) with a MySQL connection pool (`config/db.js` — `mysql2/promise`). All routes are protected by JWT middleware (`middleware/auth.js`) except `/api/auth/login`. Validation errors are handled by `middleware/validate.js` (wraps `express-validator`).

Route files map 1:1 to database tables/domains: `auth`, `courses`, `income`, `expenses`, `categories`, `paymentMethods`, `dashboard`, `reports`. Routes execute raw SQL via the pool — no ORM.

Key business rules enforced in routes:
- `net_amount` is always computed as `gross_amount - transaction_fee` (never set by client)
- `installment_status` is forced to `'N/A'` when `payment_type = 'Full'`
- Course and category deletions are soft deletes (status → `Cancelled` / `inactive`)

### Frontend (`sage-academy/frontend/`)

React 18 + Vite, styled with Tailwind CSS. Routing via React Router v6 (all pages under a single `<Layout />` protected route). Auth state lives in `AuthContext` — JWT stored in `localStorage`, attached to every request via an Axios interceptor in `api/client.js`. A 401 response auto-clears the token and redirects to `/login`.

**Data flow pattern:** pages call `api/client.js` directly (axios instance); `hooks/useApi.js` provides a generic fetch wrapper. Toast notifications use `react-hot-toast`. Charts use Recharts.

**UI components** (`components/ui/`): `KPICard`, `Table`, `Modal`, `Badge`, `Button`, `Input`, `Select` — reuse these before creating new ones.

**Form components** (`components/forms/`): one form per entity (`IncomeForm`, `ExpenseForm`, `CourseForm`, `CategoryForm`, `PaymentMethodForm`) — used inside `Modal` for create/edit flows.

### Database schema

Five core tables: `users`, `courses`, `payment_methods`, `expense_categories`, `income`, `expenses`. `income` and `expenses` both reference `courses` with `ON DELETE RESTRICT`. All monetary columns are `DECIMAL(10,2)`.

## Key conventions

- All protected API routes require `Authorization: Bearer <token>` header
- Backend uses CommonJS (`require`/`module.exports`); frontend uses ES modules (`import`/`export`)
- Environment variables: backend uses `.env` via `dotenv`; frontend uses Vite's `VITE_` prefix convention
- No test suite is configured — validate changes by running the dev servers
