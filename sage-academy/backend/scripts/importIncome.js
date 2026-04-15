/**
 * Import income records from Excel into the database.
 * Usage: node scripts/importIncome.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../../../Income - Sage Academy.xlsx');

// ── Course name normalisation ─────────────────────────────────────────────────
const COURSE_MAP = {
  'endodontics':                                                        'Endodontics',
  '10 days dental nurse training':                                      '10 Days Dental Nurse Training',
  'periodontics':                                                       'Periodontics',
  'dental nurse training (nebdn)':                                      'Dental Nurse Training (NEBDN)',
  'sedation mentorship program':                                        'Sedation Mentorship Program',
  'sedation mentorship programme-nurses':                               'Sedation Mentorship Program',
  'sedation mantorship':                                                'Sedation Mentorship Program',
  'sedation':                                                           'Sedation Mentorship Program',
  'bls course':                                                         'BLS Course',
  'restorative dentistry':                                              'Restorative Dentistry',
  'minor oral surgery':                                                 '1-Day Intensive Minor Oral Surgery (MOS) Course',
  'practical la':                                                       'Others',
  'practical la`':                                                      'Others',
  'gdc 9 standerds':                                                    'Others',
  'navigating the nhs regulations: from practice to performance':       'Others',
  'teacher training course':                                            'Others',
  'others':                                                             'Others',
};

function normaliseCourse(raw) {
  if (!raw) return 'Others';
  const key = String(raw).trim().toLowerCase();
  return COURSE_MAP[key] || 'Others';
}

// ── Payment method normalisation ─────────────────────────────────────────────
function normaliseMethod(raw) {
  if (!raw) return 'Cash';
  switch (String(raw).trim().toLowerCase()) {
    case 'paypal':      return 'PayPal';
    case 'gocardless':  return 'GoCardless';
    case 'cash':        return 'Cash';
    case 'hsbc':        return 'Bank Transfer';
    case 'tide':        return 'Bank Transfer';
    case 'stripe':      return 'Card';
    default:            return 'Cash';
  }
}

// ── Excel serial date → JS Date string (YYYY-MM-DD) ──────────────────────────
function excelDateToISO(serial) {
  // Excel epoch is 1899-12-30 (accounting for the Lotus 1-2-3 leap year bug)
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

async function main() {
  // ── Load Excel ──────────────────────────────────────────────────────────────
  console.log('Reading Excel file…');
  const wb = xlsx.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log(`Total rows in sheet (inc. header): ${rows.length}`);

  // ── Connect to DB ───────────────────────────────────────────────────────────
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // ── Load lookup tables ──────────────────────────────────────────────────────
  const [courseRows]  = await pool.query('SELECT id, course_name FROM courses');
  const [methodRows]  = await pool.query('SELECT id, name FROM payment_methods');

  const courseByName = {};
  courseRows.forEach(r => { courseByName[r.course_name] = r.id; });

  const methodByName = {};
  methodRows.forEach(r => { methodByName[r.name] = r.id; });

  console.log(`Loaded ${courseRows.length} courses, ${methodRows.length} payment methods from DB`);

  // ── Process rows ────────────────────────────────────────────────────────────
  let imported = 0;
  let skipped  = 0;
  const failures = [];

  for (let i = 1; i < rows.length; i++) {
    const [dateRaw, , studentName, courseNameRaw, grossRaw, chargesRaw, netRaw, methodRaw, notesRaw, studyMethodRaw] = rows[i];

    // Skip rows with no date or no student name, and skip the "Income" summary row
    if (!dateRaw || !studentName || typeof studentName !== 'string' || studentName.trim() === 'Income') {
      skipped++;
      continue;
    }

    try {
      // Date
      const paymentDate = excelDateToISO(dateRaw);

      // Course
      const canonicalCourse = normaliseCourse(courseNameRaw);
      const courseId = courseByName[canonicalCourse];
      if (!courseId) {
        failures.push({ row: i + 1, reason: `Course not found in DB: "${canonicalCourse}" (raw: "${courseNameRaw}")`, data: rows[i] });
        continue;
      }

      // Payment method
      const canonicalMethod = normaliseMethod(methodRaw);
      const methodId = methodByName[canonicalMethod];
      if (!methodId) {
        failures.push({ row: i + 1, reason: `Payment method not found in DB: "${canonicalMethod}" (raw: "${methodRaw}")`, data: rows[i] });
        continue;
      }

      // Amounts
      const gross = parseFloat(grossRaw) || 0;
      const fee   = parseFloat(chargesRaw) || 0;
      // Use net from Excel if available, otherwise calculate
      const net   = (netRaw !== null && netRaw !== undefined && netRaw !== '') ? parseFloat(netRaw) : (gross - fee);

      // Notes: combine Notes + Chosen study Method
      const noteParts = [];
      if (notesRaw && String(notesRaw).trim()) noteParts.push(String(notesRaw).trim());
      if (studyMethodRaw && String(studyMethodRaw).trim()) noteParts.push(String(studyMethodRaw).trim());
      const notes = noteParts.length > 0 ? noteParts.join(' | ') : null;

      await pool.query(
        `INSERT INTO income
           (course_id, payment_date, payer_name, payment_method_id,
            payment_type, installment_status, gross_amount, transaction_fee, net_amount, notes)
         VALUES (?, ?, ?, ?, 'Full', 'N/A', ?, ?, ?, ?)`,
        [courseId, paymentDate, studentName.trim(), methodId, gross, fee, net, notes]
      );

      imported++;
    } catch (err) {
      failures.push({ row: i + 1, reason: err.message, data: rows[i] });
    }
  }

  await pool.end();

  // ── Report ──────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  IMPORT COMPLETE`);
  console.log(`  Imported : ${imported}`);
  console.log(`  Skipped  : ${skipped}  (empty/summary rows)`);
  console.log(`  Failed   : ${failures.length}`);
  console.log('══════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\nFailed rows:');
    failures.forEach(f => {
      console.log(`  Row ${f.row}: ${f.reason}`);
    });
  } else {
    console.log('\nNo failures — all data rows imported successfully.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
