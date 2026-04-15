-- Sage Academy Financial Dashboard Schema
CREATE DATABASE IF NOT EXISTS sage_academy_finance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sage_academy_finance;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  lecturer_name VARCHAR(255) NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_courses_status (status)
) ENGINE=InnoDB;

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  payment_method_id INT NOT NULL,
  payment_type ENUM('Full', 'Installment') NOT NULL DEFAULT 'Full',
  installment_status ENUM('Pending', 'Completed', 'N/A') NOT NULL DEFAULT 'N/A',
  gross_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  transaction_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT,
  INDEX idx_income_course (course_id),
  INDEX idx_income_date (payment_date),
  INDEX idx_income_method (payment_method_id),
  INDEX idx_income_installment (installment_status)
) ENGINE=InnoDB;

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  expense_date DATE NOT NULL,
  category_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  vendor VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
  INDEX idx_expenses_course (course_id),
  INDEX idx_expenses_date (expense_date),
  INDEX idx_expenses_category (category_id)
) ENGINE=InnoDB;
