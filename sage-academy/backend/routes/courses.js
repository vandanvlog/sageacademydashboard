const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/courses
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.*,
        COALESCE(it.total_income, 0) AS total_income,
        COALESCE(et.total_expenses, 0) AS total_expenses,
        COALESCE(it.total_income, 0) - COALESCE(et.total_expenses, 0) AS profit
      FROM courses c
      LEFT JOIN (
        SELECT course_id, SUM(net_amount) AS total_income
        FROM income
        GROUP BY course_id
      ) it ON it.course_id = c.id
      LEFT JOIN (
        SELECT course_id, SUM(amount) AS total_expenses
        FROM expenses
        GROUP BY course_id
      ) et ON et.course_id = c.id
      ORDER BY c.course_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.*,
        COALESCE(it.total_income, 0) AS total_income,
        COALESCE(et.total_expenses, 0) AS total_expenses,
        COALESCE(it.total_income, 0) - COALESCE(et.total_expenses, 0) AS profit
      FROM courses c
      LEFT JOIN (
        SELECT course_id, SUM(net_amount) AS total_income
        FROM income WHERE course_id = ?
        GROUP BY course_id
      ) it ON it.course_id = c.id
      LEFT JOIN (
        SELECT course_id, SUM(amount) AS total_expenses
        FROM expenses WHERE course_id = ?
        GROUP BY course_id
      ) et ON et.course_id = c.id
      WHERE c.id = ?
    `, [req.params.id, req.params.id, req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses
router.post('/', auth, async (req, res) => {
  try {
    const { course_name, lecturer_name, status } = req.body;
    if (!course_name || !lecturer_name) {
      return res.status(400).json({ message: 'course_name and lecturer_name are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO courses (course_name, lecturer_name, status) VALUES (?, ?, ?)',
      [course_name, lecturer_name, status || 'Active']
    );
    const [newCourse] = await pool.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
    res.status(201).json(newCourse[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/courses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { course_name, lecturer_name, status } = req.body;
    const [existing] = await pool.query('SELECT id FROM courses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await pool.query(
      'UPDATE courses SET course_name = ?, lecturer_name = ?, status = ? WHERE id = ?',
      [course_name, lecturer_name, status, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/courses/:id — soft delete (set Inactive)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM courses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await pool.query('UPDATE courses SET status = ? WHERE id = ?', ['Inactive', req.params.id]);
    res.json({ message: 'Course deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
