const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/categories
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM expense_categories WHERE status = ? ORDER BY name ASC',
      ['active']
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/all  (includes inactive)
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expense_categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO expense_categories (name, status) VALUES (?, ?)',
      [name, 'active']
    );
    const [newCat] = await pool.query('SELECT * FROM expense_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCat[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, status } = req.body;
    const [existing] = await pool.query('SELECT id FROM expense_categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await pool.query(
      'UPDATE expense_categories SET name = ?, status = ? WHERE id = ?',
      [name, status, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM expense_categories WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM expense_categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await pool.query('UPDATE expense_categories SET status = ? WHERE id = ?', ['inactive', req.params.id]);
    res.json({ message: 'Category deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
