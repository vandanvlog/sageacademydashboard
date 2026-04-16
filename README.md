# Sage Academy Financial Dashboard

A full-stack financial management web application for tracking income, expenses, and course-level profitability for an education business.

---

## Features

- **Dashboard** — KPI cards (total income, expenses, net profit), monthly revenue/expense charts, and a profit breakdown per course
- **Income Tracking** — Log student payments with support for full and installment payment types, transaction fees, and automatic net amount calculation
- **Expense Tracking** — Record course expenses by category with vendor and date filtering
- **Course Management** — Manage courses and lecturers; view per-course financial performance
- **Reports** — Filter and export financial summaries by month, year, course, or category
- **Settings** — Manage expense categories and payment methods
- **JWT Authentication** — Secure login with role-based access (admin / user)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| HTTP Client | Axios |

---

## Project Structure

```
.
└── sage-academy/
    ├── backend/
    │   ├── server.js               # Express app entry point
    │   ├── config/
    │   │   └── db.js               # MySQL connection pool (mysql2/promise)
    │   ├── middleware/
    │   │   ├── auth.js             # JWT verification middleware
    │   │   └── validate.js         # express-validator error handler
    │   ├── routes/
    │   │   ├── auth.js             # Login + current user
    │   │   ├── courses.js          # Course CRUD + financials
    │   │   ├── income.js           # Income CRUD + filters
    │   │   ├── expenses.js         # Expense CRUD + filters
    │   │   ├── categories.js       # Expense categories (soft delete)
    │   │   ├── paymentMethods.js   # Payment methods CRUD
    │   │   ├── dashboard.js        # KPIs, chart data, summary tables
    │   │   └── reports.js          # Filtered financial reports
    │   └── database/
    │       ├── schema.sql          # Table definitions
    │       ├── seed.sql            # Reference data + sample records
    │       └── seed.js             # Creates admin user (bcrypt hash)
    │
    └── frontend/
        └── src/
            ├── api/client.js       # Axios instance with JWT interceptor
            ├── context/AuthContext.jsx
            ├── pages/              # Dashboard, Income, Expenses, Courses, Reports, Settings
            └── components/
                ├── ui/             # KPICard, Table, Modal, Badge, Button, Input, Select
                ├── forms/          # IncomeForm, ExpenseForm, CourseForm, etc.
                └── charts/         # RevenueChart, ExpenseChart, ProfitChart, CategoryPieChart
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm

### 1. Database Setup

```bash
cd sage-academy

mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
```

### 2. Backend

```bash
cd sage-academy/backend

npm install
cp .env.example .env   # fill in DB credentials and JWT_SECRET
node database/seed.js  # creates the admin user
npm run dev            # starts on http://localhost:5000
```

`.env` example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sage_academy_finance
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Frontend

```bash
cd sage-academy/frontend

npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev            # starts on http://localhost:5173
```

### Default Login

| Email | Password | Role |
|---|---|---|
| admin@sageacademy.com | Admin123! | admin |

---

## API Reference

All routes except `/api/auth/login` require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current authenticated user |
| GET | `/api/dashboard` | KPIs, chart data, tables (`?year=`) |
| GET/POST | `/api/courses` | List / create courses |
| PUT/DELETE | `/api/courses/:id` | Update / soft-cancel course |
| GET/POST | `/api/income` | List (`?month&year&course_id`) / create |
| PUT/DELETE | `/api/income/:id` | Update / delete income record |
| GET/POST | `/api/expenses` | List (`?month&year&category_id`) / create |
| PUT/DELETE | `/api/expenses/:id` | Update / delete expense |
| GET/POST | `/api/categories` | List / create expense categories |
| PUT/DELETE | `/api/categories/:id` | Update / soft-deactivate category |
| GET/POST | `/api/payment-methods` | List / create payment methods |
| PUT | `/api/payment-methods/:id` | Update payment method |
| GET | `/api/reports/summary` | Filtered financial summary |
| GET | `/api/health` | Health check |

---

## Business Rules

- `net_amount` is always auto-calculated as `gross_amount − transaction_fee` (never set directly by the client)
- `installment_status` is forced to `N/A` when `payment_type` is `Full`
- Course deletion is a soft delete — status changes to `Cancelled`
- Category deletion is a soft delete — status changes to `inactive`

---

## Database Schema

```
users              — id, name, email, password_hash, role
courses            — id, course_name, lecturer_name, status
payment_methods    — id, name, status
expense_categories — id, name, status
income             — id, course_id, payer_name, payment_method_id, payment_type,
                     installment_status, gross_amount, transaction_fee, net_amount, payment_date
expenses           — id, course_id, category_id, description, vendor, amount, expense_date
```

All monetary columns are `DECIMAL(10,2)`. Foreign keys on `income` and `expenses` use `ON DELETE RESTRICT`.
