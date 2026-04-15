const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/expenses
router.get('/', auth, async (req, res) => {
  try {
    const { course_id, category_id, month, year } = req.query;

    let query = `
      SELECT
        e.*,
        c.course_name,
        ec.name AS category_name
      FROM expenses e
      JOIN courses c ON c.id = e.course_id
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND e.course_id = ?'; params.push(course_id); }
    if (category_id) { query += ' AND e.category_id = ?'; params.push(category_id); }
    if (month) { query += ' AND MONTH(e.expense_date) = ?'; params.push(month); }
    if (year) { query += ' AND YEAR(e.expense_date) = ?'; params.push(year); }

    query += ' ORDER BY e.expense_date DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/expenses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.*,
        c.course_name,
        ec.name AS category_name
      FROM expenses e
      JOIN courses c ON c.id = e.course_id
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE e.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res) => {
  try {
    const { course_id, expense_date, category_id, description, vendor, amount, notes } = req.body;

    if (!course_id || !expense_date || !category_id || !description || amount === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (course_id, expense_date, category_id, description, vendor, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, expense_date, category_id, description, vendor || null, parseFloat(amount), notes || null]
    );

    const [newRecord] = await pool.query(`
      SELECT e.*, c.course_name, ec.name AS category_name
      FROM expenses e
      JOIN courses c ON c.id = e.course_id
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { course_id, expense_date, category_id, description, vendor, amount, notes } = req.body;

    const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    await pool.query(
      `UPDATE expenses SET course_id = ?, expense_date = ?, category_id = ?,
       description = ?, vendor = ?, amount = ?, notes = ? WHERE id = ?`,
      [course_id, expense_date, category_id, description, vendor || null,
       parseFloat(amount), notes || null, req.params.id]
    );

    const [updated] = await pool.query(`
      SELECT e.*, c.course_name, ec.name AS category_name
      FROM expenses e
      JOIN courses c ON c.id = e.course_id
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE e.id = ?
    `, [req.params.id]);

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense record not found' });
    }
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
