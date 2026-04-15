/**
 * Creates the admin user with a properly bcrypt-hashed password.
 * Run after schema.sql and seed.sql have been executed.
 * Usage: node database/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@sageacademy.com']
    );

    if (existing.length > 0) {
      console.log('Admin user already exists — skipping.');
      return;
    }

    const hash = await bcrypt.hash('Admin123!', 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin@sageacademy.com', hash, 'admin']
    );

    console.log('✅ Admin user created successfully.');
    console.log('   Email   : admin@sageacademy.com');
    console.log('   Password: Admin123!');
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
