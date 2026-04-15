const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Build a full 12-month array for a given year
function buildMonthlyArray(data, key, year) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
    [key]: 0,
  }));
  data.forEach((row) => {
    const idx = row.month - 1;
    if (idx >= 0 && idx < 12) {
      months[idx][key] = parseFloat(row[key]) || 0;
    }
  });
  return months;
}

// Build a yearly array from [{year, <key>}] rows
function buildYearlyArray(revenueRows, expenseRows) {
  const yearSet = new Set();
  revenueRows.forEach(r => yearSet.add(r.year));
  expenseRows.forEach(r => yearSet.add(r.year));
  const years = [...yearSet].sort();

  const revMap = {};
  revenueRows.forEach(r => { revMap[r.year] = parseFloat(r.revenue) || 0; });
  const expMap = {};
  expenseRows.forEach(r => { expMap[r.year] = parseFloat(r.expenses) || 0; });

  return years.map(y => ({
    label: String(y),
    revenue:  revMap[y]  || 0,
    expenses: expMap[y]  || 0,
    profit:   (revMap[y] || 0) - (expMap[y] || 0),
  }));
}

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const yearParam = req.query.year;
    const allTime = yearParam === 'all';
    const year = allTime ? null : (parseInt(yearParam) || new Date().getFullYear());
    const currentMonth = new Date().getMonth() + 1;
    const currentYear  = new Date().getFullYear();
    // For past years show full year; for current year show YTD
    const kpiMaxMonth  = (!allTime && year < currentYear) ? 12 : currentMonth;

    // ── KPIs ────────────────────────────────────────────────────────────────
    const [[kpiRevenue]] = allTime
      ? await pool.query(`SELECT COALESCE(SUM(net_amount), 0) AS total_revenue FROM income`)
      : await pool.query(
          `SELECT COALESCE(SUM(net_amount), 0) AS total_revenue
           FROM income WHERE YEAR(payment_date) = ? AND MONTH(payment_date) <= ?`,
          [year, kpiMaxMonth]
        );

    const [[kpiExpenses]] = allTime
      ? await pool.query(`SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses`)
      : await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total_expenses
           FROM expenses WHERE YEAR(expense_date) = ? AND MONTH(expense_date) <= ?`,
          [year, kpiMaxMonth]
        );

    const [[activeCourses]] = await pool.query(
      `SELECT COUNT(*) AS active_courses FROM courses WHERE status = 'Active'`
    );

    // Month-over-month change (always real current-month vs last-month)
    const lastMonth     = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [[lastRevenue]] = await pool.query(
      `SELECT COALESCE(SUM(net_amount), 0) AS total_revenue
       FROM income WHERE YEAR(payment_date) = ? AND MONTH(payment_date) = ?`,
      [lastMonthYear, lastMonth]
    );
    const [[lastExpenses]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM expenses WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?`,
      [lastMonthYear, lastMonth]
    );
    const [[currentRevenue]] = await pool.query(
      `SELECT COALESCE(SUM(net_amount), 0) AS total_revenue
       FROM income WHERE YEAR(payment_date) = ? AND MONTH(payment_date) = ?`,
      [currentYear, currentMonth]
    );
    const [[currentExpensesMonth]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM expenses WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?`,
      [currentYear, currentMonth]
    );

    const totalRevenue  = parseFloat(kpiRevenue.total_revenue);
    const totalExpenses = parseFloat(kpiExpenses.total_expenses);

    const calcChange = (current, last) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    // ── Chart data ───────────────────────────────────────────────────────────
    let revenueByMonth, expensesByMonth, profitByMonth;

    if (allTime) {
      // Group by year
      const [revYears] = await pool.query(
        `SELECT YEAR(payment_date) AS year, SUM(net_amount) AS revenue
         FROM income GROUP BY YEAR(payment_date) ORDER BY year`
      );
      const [expYears] = await pool.query(
        `SELECT YEAR(expense_date) AS year, SUM(amount) AS expenses
         FROM expenses GROUP BY YEAR(expense_date) ORDER BY year`
      );
      const yearly = buildYearlyArray(revYears, expYears);
      revenueByMonth  = yearly; // same shape: { label, revenue }
      expensesByMonth = yearly; // same shape: { label, expenses }
      profitByMonth   = yearly; // same shape: { label, profit }
    } else {
      // Group by month within selected year
      const [revenueData] = await pool.query(
        `SELECT MONTH(payment_date) AS month, SUM(net_amount) AS revenue
         FROM income WHERE YEAR(payment_date) = ?
         GROUP BY MONTH(payment_date)`,
        [year]
      );
      const [expensesData] = await pool.query(
        `SELECT MONTH(expense_date) AS month, SUM(amount) AS expenses
         FROM expenses WHERE YEAR(expense_date) = ?
         GROUP BY MONTH(expense_date)`,
        [year]
      );
      revenueByMonth  = buildMonthlyArray(revenueData,  'revenue',  year);
      expensesByMonth = buildMonthlyArray(expensesData, 'expenses', year);
      profitByMonth   = revenueByMonth.map((r, i) => ({
        month:  r.month,
        label:  r.label,
        profit: r.revenue - expensesByMonth[i].expenses,
      }));
    }

    // ── Expense by category ──────────────────────────────────────────────────
    const [catData] = allTime
      ? await pool.query(
          `SELECT ec.name AS category, SUM(e.amount) AS amount
           FROM expenses e
           JOIN expense_categories ec ON ec.id = e.category_id
           GROUP BY ec.id, ec.name
           ORDER BY amount DESC`
        )
      : await pool.query(
          `SELECT ec.name AS category, SUM(e.amount) AS amount
           FROM expenses e
           JOIN expense_categories ec ON ec.id = e.category_id
           WHERE YEAR(e.expense_date) = ?
           GROUP BY ec.id, ec.name
           ORDER BY amount DESC`,
          [year]
        );

    const totalCatAmount = catData.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const expenseByCategory = catData.map((r) => ({
      category:   r.category,
      amount:     parseFloat(r.amount),
      percentage: totalCatAmount > 0 ? ((r.amount / totalCatAmount) * 100).toFixed(1) : 0,
    }));

    // ── Recent income (last 5, always all-time) ──────────────────────────────
    const [recentIncome] = await pool.query(
      `SELECT i.id, i.payment_date, i.payer_name, i.gross_amount, i.net_amount,
              i.payment_type, i.installment_status, i.transaction_fee,
              c.course_name, pm.name AS payment_method_name
       FROM income i
       JOIN courses c  ON c.id  = i.course_id
       JOIN payment_methods pm ON pm.id = i.payment_method_id
       ORDER BY i.payment_date DESC, i.id DESC
       LIMIT 5`
    );

    // ── Recent expenses (last 5, always all-time) ────────────────────────────
    const [recentExpenses] = await pool.query(
      `SELECT e.id, e.expense_date, e.description, e.vendor, e.amount,
              c.course_name, ec.name AS category_name
       FROM expenses e
       JOIN courses c ON c.id = e.course_id
       JOIN expense_categories ec ON ec.id = e.category_id
       ORDER BY e.expense_date DESC, e.id DESC
       LIMIT 5`
    );

    // ── Top courses by profit (all-time) ─────────────────────────────────────
    const [topCourses] = await pool.query(
      `SELECT
         c.id, c.course_name, c.status,
         COALESCE(it.revenue,  0) AS revenue,
         COALESCE(et.expenses, 0) AS expenses,
         COALESCE(it.revenue,  0) - COALESCE(et.expenses, 0) AS profit
       FROM courses c
       LEFT JOIN (
         SELECT course_id, SUM(net_amount) AS revenue  FROM income   GROUP BY course_id
       ) it ON it.course_id = c.id
       LEFT JOIN (
         SELECT course_id, SUM(amount)     AS expenses FROM expenses GROUP BY course_id
       ) et ON et.course_id = c.id
       ORDER BY profit DESC
       LIMIT 10`
    );

    // ── Pending installments ─────────────────────────────────────────────────
    const [pendingInstallments] = await pool.query(
      `SELECT i.*, c.course_name, pm.name AS payment_method_name
       FROM income i
       JOIN courses c  ON c.id  = i.course_id
       JOIN payment_methods pm ON pm.id = i.payment_method_id
       WHERE i.installment_status = 'Pending'
       ORDER BY i.payment_date ASC`
    );

    res.json({
      kpis: {
        total_revenue:   totalRevenue,
        total_expenses:  totalExpenses,
        net_profit:      totalRevenue - totalExpenses,
        active_courses:  activeCourses.active_courses,
        revenue_change:  calcChange(
          parseFloat(currentRevenue.total_revenue),
          parseFloat(lastRevenue.total_revenue)
        ),
        expenses_change: calcChange(
          parseFloat(currentExpensesMonth.total_expenses),
          parseFloat(lastExpenses.total_expenses)
        ),
        profit_change:   calcChange(
          parseFloat(currentRevenue.total_revenue)      - parseFloat(currentExpensesMonth.total_expenses),
          parseFloat(lastRevenue.total_revenue)         - parseFloat(lastExpenses.total_expenses)
        ),
      },
      revenue_by_month:   revenueByMonth,
      expenses_by_month:  expensesByMonth,
      profit_by_month:    profitByMonth,
      expense_by_category: expenseByCategory,
      recent_income:       recentIncome,
      recent_expenses:     recentExpenses,
      top_courses:         topCourses,
      pending_installments: pendingInstallments,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
