const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/payment-methods
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payment_methods WHERE status = ? ORDER BY name ASC',
      ['active']
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/payment-methods/all (includes inactive)
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_methods ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/payment-methods
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO payment_methods (name, status) VALUES (?, ?)',
      [name, 'active']
    );
    const [newMethod] = await pool.query('SELECT * FROM payment_methods WHERE id = ?', [result.insertId]);
    res.status(201).json(newMethod[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/payment-methods/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, status } = req.body;
    const [existing] = await pool.query('SELECT id FROM payment_methods WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    await pool.query(
      'UPDATE payment_methods SET name = ?, status = ? WHERE id = ?',
      [name, status, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM payment_methods WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
