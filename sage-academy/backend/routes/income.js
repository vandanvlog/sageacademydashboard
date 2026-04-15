const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/income
router.get('/', auth, async (req, res) => {
  try {
    const { course_id, payment_method_id, month, year, payment_type } = req.query;

    let query = `
      SELECT
        i.*,
        c.course_name,
        pm.name AS payment_method_name
      FROM income i
      JOIN courses c ON c.id = i.course_id
      JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND i.course_id = ?'; params.push(course_id); }
    if (payment_method_id) { query += ' AND i.payment_method_id = ?'; params.push(payment_method_id); }
    if (month) { query += ' AND MONTH(i.payment_date) = ?'; params.push(month); }
    if (year) { query += ' AND YEAR(i.payment_date) = ?'; params.push(year); }
    if (payment_type) { query += ' AND i.payment_type = ?'; params.push(payment_type); }

    query += ' ORDER BY i.payment_date DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/income/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        i.*,
        c.course_name,
        pm.name AS payment_method_name
      FROM income i
      JOIN courses c ON c.id = i.course_id
      JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/income
router.post('/', auth, async (req, res) => {
  try {
    const {
      course_id, payment_date, payer_name, payment_method_id,
      payment_type, installment_status, gross_amount, transaction_fee, notes
    } = req.body;

    if (!course_id || !payment_date || !payer_name || !payment_method_id || !payment_type || gross_amount === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const fee = parseFloat(transaction_fee) || 0;
    const gross = parseFloat(gross_amount);
    const net = gross - fee;

    const instStatus = payment_type === 'Full' ? 'N/A' : (installment_status || 'Pending');

    const [result] = await pool.query(
      `INSERT INTO income
        (course_id, payment_date, payer_name, payment_method_id, payment_type,
         installment_status, gross_amount, transaction_fee, net_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, payment_date, payer_name, payment_method_id, payment_type,
       instStatus, gross, fee, net, notes || null]
    );

    const [newRecord] = await pool.query(`
      SELECT i.*, c.course_name, pm.name AS payment_method_name
      FROM income i
      JOIN courses c ON c.id = i.course_id
      JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.id = ?
    `, [result.insertId]);

    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/income/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      course_id, payment_date, payer_name, payment_method_id,
      payment_type, installment_status, gross_amount, transaction_fee, notes
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM income WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    const fee = parseFloat(transaction_fee) || 0;
    const gross = parseFloat(gross_amount);
    const net = gross - fee;
    const instStatus = payment_type === 'Full' ? 'N/A' : (installment_status || 'Pending');

    await pool.query(
      `UPDATE income SET
        course_id = ?, payment_date = ?, payer_name = ?, payment_method_id = ?,
        payment_type = ?, installment_status = ?, gross_amount = ?,
        transaction_fee = ?, net_amount = ?, notes = ?
       WHERE id = ?`,
      [course_id, payment_date, payer_name, payment_method_id, payment_type,
       instStatus, gross, fee, net, notes || null, req.params.id]
    );

    const [updated] = await pool.query(`
      SELECT i.*, c.course_name, pm.name AS payment_method_name
      FROM income i
      JOIN courses c ON c.id = i.course_id
      JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.id = ?
    `, [req.params.id]);

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/income/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM income WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    await pool.query('DELETE FROM income WHERE id = ?', [req.params.id]);
    res.json({ message: 'Income record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
