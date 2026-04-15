# Sage Academy — Financial Dashboard

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm

---

## 1. MySQL Database Setup

Open a MySQL client (MySQL Workbench, CLI, or TablePlus) and run:

```sql
-- Step 1: Create the database and tables
SOURCE /path/to/sage-academy/backend/database/schema.sql;

-- Step 2: Insert seed data (payment methods, categories, courses, income, expenses)
SOURCE /path/to/sage-academy/backend/database/seed.sql;
```

**Or using the MySQL CLI:**

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
```

---

## 2. Backend Setup

```bash
cd sage-academy/backend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sage_academy_finance
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Create the admin user** (hashes the password properly with bcrypt):

```bash
node database/seed.js
```

You should see:
```
✅ Admin user created successfully.
   Email   : admin@sageacademy.com
   Password: Admin123!
```

**Start the backend:**

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Backend runs at: **http://localhost:5000**
Health check: **http://localhost:5000/api/health**

---

## 3. Frontend Setup

```bash
cd sage-academy/frontend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env
```

The default `.env` is:
```env
VITE_API_URL=http://localhost:5000/api
```

**Start the frontend:**

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 4. Default Login Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@sageacademy.com    |
| Password | Admin123!                |
| Role     | admin                    |

---

## 5. Full Quick-Start (all steps in sequence)

```bash
# 1. Database
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql

# 2. Backend
cd backend
npm install
cp .env.example .env
# ← edit .env with your DB password and JWT_SECRET
node database/seed.js
npm run dev &

# 3. Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser and log in.

---

## Project Structure

```
sage-academy/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── .env.example
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── validate.js         # express-validator error handler
│   ├── routes/
│   │   ├── auth.js             # POST /login, GET /me
│   │   ├── courses.js          # CRUD + financial stats
│   │   ├── income.js           # CRUD + filters
│   │   ├── expenses.js         # CRUD + filters
│   │   ├── categories.js       # CRUD (soft delete)
│   │   ├── paymentMethods.js   # CRUD
│   │   ├── dashboard.js        # KPIs + charts + tables
│   │   └── reports.js          # Filtered summary
│   └── database/
│       ├── schema.sql          # Table definitions
│       ├── seed.sql            # Reference data + sample records
│       └── seed.js             # Creates admin user with bcrypt hash
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/client.js       # Axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── hooks/useApi.js
        ├── pages/              # Login, Dashboard, Income, Expenses, Courses, Reports, Settings
        └── components/
            ├── layout/         # Sidebar, Header, Layout
            ├── ui/             # KPICard, Table, Modal, Badge, Button, Input, Select
            ├── forms/          # IncomeForm, ExpenseForm, CourseForm, CategoryForm, PaymentMethodForm
            └── charts/         # RevenueChart, ExpenseChart, ProfitChart, CategoryPieChart
```

---

## API Endpoints

| Method | Path                      | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | /api/auth/login           | Login → returns JWT                |
| GET    | /api/auth/me              | Current user                       |
| GET    | /api/dashboard            | KPIs, charts, tables (?year=)      |
| GET    | /api/courses              | All courses with financials        |
| POST   | /api/courses              | Create course                      |
| PUT    | /api/courses/:id          | Update course                      |
| DELETE | /api/courses/:id          | Soft-cancel course                 |
| GET    | /api/income               | List income (?month&year&course_id)|
| POST   | /api/income               | Create income record               |
| PUT    | /api/income/:id           | Update income record               |
| DELETE | /api/income/:id           | Delete income record               |
| GET    | /api/expenses             | List expenses (?month&year&etc)    |
| POST   | /api/expenses             | Create expense                     |
| PUT    | /api/expenses/:id         | Update expense                     |
| DELETE | /api/expenses/:id         | Delete expense                     |
| GET    | /api/categories           | Active categories                  |
| POST   | /api/categories           | Create category                    |
| PUT    | /api/categories/:id       | Update category                    |
| DELETE | /api/categories/:id       | Soft-deactivate category           |
| GET    | /api/payment-methods      | Active payment methods             |
| POST   | /api/payment-methods      | Create payment method              |
| PUT    | /api/payment-methods/:id  | Update payment method              |
| GET    | /api/reports/summary      | Filtered financial summary         |
| GET    | /api/health               | Health check                       |

---

## Notes

- All protected routes require `Authorization: Bearer <token>` header
- `net_amount` is always auto-calculated as `gross_amount - transaction_fee`
- `installment_status` is forced to `N/A` when `payment_type = Full`
- Course deletion is a soft delete (status → Cancelled)
- Category deletion is a soft delete (status → inactive)
