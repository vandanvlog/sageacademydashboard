-- Sage Academy Seed Data
-- NOTE: Admin user is created via: node database/seed.js
-- This file seeds all reference and sample data.

USE sage_academy_finance;

-- Payment methods
INSERT INTO payment_methods (name, status) VALUES
  ('PayPal', 'active'),
  ('GoCardless', 'active'),
  ('Cash', 'active'),
  ('Bank Transfer', 'active'),
  ('Card', 'active');

-- Expense categories
INSERT INTO expense_categories (name, status) VALUES
  ('Marketing', 'active'),
  ('Venue', 'active'),
  ('Equipment', 'active'),
  ('Lecturer Fees', 'active'),
  ('Admin', 'active'),
  ('Software', 'active'),
  ('Other', 'active');

-- Sample courses
INSERT INTO courses (course_name, lecturer_name, course_date, price_per_student, status) VALUES
  ('Advanced Dental Implants', 'Dr. Sarah Mitchell', '2026-01-15', 850.00, 'Completed'),
  ('Orthodontics Fundamentals', 'Dr. James Chen', '2026-02-20', 650.00, 'Completed'),
  ('Endodontics Masterclass', 'Dr. Emily Roberts', '2026-03-10', 750.00, 'Active');

-- Sample income (course_id references above courses; payment_method_id references payment_methods)
INSERT INTO income (course_id, payment_date, payer_name, payment_method_id, payment_type, installment_status, gross_amount, transaction_fee, net_amount, notes) VALUES
  (1, '2025-11-05', 'Dr. Liam Turner', 1, 'Full', 'N/A', 900.00, 27.00, 873.00, 'Early registration'),
  (1, '2025-11-10', 'Dr. Olivia Hayes', 4, 'Full', 'N/A', 900.00, 0.00, 900.00, NULL),
  (1, '2025-12-01', 'Dr. Noah Bennett', 2, 'Installment', 'Completed', 450.00, 4.50, 445.50, 'First instalment'),
  (1, '2026-01-05', 'Dr. Noah Bennett', 2, 'Installment', 'Completed', 450.00, 4.50, 445.50, 'Second instalment'),
  (2, '2025-12-15', 'Dr. Ava Collins', 5, 'Full', 'N/A', 680.00, 20.40, 659.60, NULL),
  (2, '2026-01-08', 'Dr. Sophia Ward', 3, 'Full', 'N/A', 680.00, 0.00, 680.00, 'Paid in cash'),
  (2, '2026-01-12', 'Dr. Mason Clark', 1, 'Installment', 'Pending', 340.00, 10.20, 329.80, 'First instalment'),
  (3, '2026-02-01', 'Dr. Isabella Lewis', 4, 'Full', 'N/A', 780.00, 0.00, 780.00, NULL),
  (3, '2026-02-14', 'Dr. Ethan Walker', 2, 'Installment', 'Pending', 390.00, 3.90, 386.10, 'First instalment'),
  (3, '2026-03-01', 'Dr. Charlotte Hall', 5, 'Full', 'N/A', 780.00, 23.40, 756.60, NULL);

-- Sample expenses
INSERT INTO expenses (course_id, expense_date, category_id, description, vendor, amount, notes) VALUES
  (1, '2025-10-20', 1, 'Facebook & Instagram Ads', 'Meta Ads', 350.00, 'Campaign for Nov course'),
  (1, '2025-11-14', 2, 'Conference Room Hire', 'Hilton Hotel London', 1200.00, 'Full day room hire'),
  (1, '2025-11-14', 4, 'Lecturer Honorarium', 'Dr. Sarah Mitchell', 1500.00, NULL),
  (2, '2026-01-15', 1, 'Email Marketing Campaign', 'Mailchimp', 89.00, NULL),
  (2, '2026-02-19', 2, 'Training Venue Hire', 'BDA Conference Centre', 950.00, 'Half-day venue'),
  (2, '2026-02-19', 4, 'Lecturer Honorarium', 'Dr. James Chen', 1200.00, NULL),
  (3, '2026-02-25', 3, 'Dental Equipment Rental', 'DentalPlus Ltd', 600.00, 'Phantom heads and instruments'),
  (3, '2026-03-01', 6, 'Video Conferencing Software', 'Zoom', 49.99, 'Monthly subscription');
