const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/reports/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year, course_id, payment_method_id } = req.query;

    // Build filter conditions
    let incomeWhere = 'WHERE 1=1';
    let expenseWhere = 'WHERE 1=1';
    const incomeParams = [];
    const expenseParams = [];

    if (year) {
      incomeWhere += ' AND YEAR(i.payment_date) = ?';
      incomeParams.push(year);
      expenseWhere += ' AND YEAR(e.expense_date) = ?';
      expenseParams.push(year);
    }
    if (month) {
      incomeWhere += ' AND MONTH(i.payment_date) = ?';
      incomeParams.push(month);
      expenseWhere += ' AND MONTH(e.expense_date) = ?';
      expenseParams.push(month);
    }
    if (course_id) {
      incomeWhere += ' AND i.course_id = ?';
      incomeParams.push(course_id);
      expenseWhere += ' AND e.course_id = ?';
      expenseParams.push(course_id);
    }
    if (payment_method_id) {
      incomeWhere += ' AND i.payment_method_id = ?';
      incomeParams.push(payment_method_id);
    }

    // KPI totals
    const [[kpis]] = await pool.query(
      `SELECT
         COALESCE(SUM(i.gross_amount), 0) AS gross_revenue,
         COALESCE(SUM(i.transaction_fee), 0) AS total_fees,
         COALESCE(SUM(i.net_amount), 0) AS net_revenue,
         COUNT(*) AS income_count
       FROM income i ${incomeWhere}`,
      incomeParams
    );
    const [[expKpis]] = await pool.query(
      `SELECT
         COALESCE(SUM(e.amount), 0) AS total_expenses,
         COUNT(*) AS expense_count
       FROM expenses e ${expenseWhere}`,
      expenseParams
    );

    // Income records (filtered)
    const [incomeRows] = await pool.query(
      `SELECT
         i.id, i.payment_date, i.payer_name, i.payment_type, i.installment_status,
         i.gross_amount, i.transaction_fee, i.net_amount, i.notes,
         c.course_name, pm.name AS payment_method_name
       FROM income i
       JOIN courses c ON c.id = i.course_id
       JOIN payment_methods pm ON pm.id = i.payment_method_id
       ${incomeWhere}
       ORDER BY i.payment_date DESC`,
      incomeParams
    );

    // Expense records (filtered)
    const [expenseRows] = await pool.query(
      `SELECT
         e.id, e.expense_date, e.description, e.vendor, e.amount, e.notes,
         c.course_name, ec.name AS category_name
       FROM expenses e
       JOIN courses c ON c.id = e.course_id
       JOIN expense_categories ec ON ec.id = e.category_id
       ${expenseWhere}
       ORDER BY e.expense_date DESC`,
      expenseParams
    );

    // Breakdown by payment method (income)
    const [byMethod] = await pool.query(
      `SELECT pm.name AS method, SUM(i.net_amount) AS amount, COUNT(*) AS count
       FROM income i
       JOIN payment_methods pm ON pm.id = i.payment_method_id
       ${incomeWhere}
       GROUP BY pm.id, pm.name
       ORDER BY amount DESC`,
      incomeParams
    );

    // Breakdown by category (expenses)
    const [byCategory] = await pool.query(
      `SELECT ec.name AS category, SUM(e.amount) AS amount, COUNT(*) AS count
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       ${expenseWhere}
       GROUP BY ec.id, ec.name
       ORDER BY amount DESC`,
      expenseParams
    );

    res.json({
      kpis: {
        gross_revenue: parseFloat(kpis.gross_revenue),
        total_fees: parseFloat(kpis.total_fees),
        net_revenue: parseFloat(kpis.net_revenue),
        income_count: kpis.income_count,
        total_expenses: parseFloat(expKpis.total_expenses),
        expense_count: expKpis.expense_count,
        net_profit: parseFloat(kpis.net_revenue) - parseFloat(expKpis.total_expenses),
      },
      income: incomeRows,
      expenses: expenseRows,
      income_by_method: byMethod,
      expenses_by_category: byCategory,
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
