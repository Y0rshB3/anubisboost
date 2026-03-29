"use strict";

const knex = require("../src/db/knex");

async function runMigrations() {
  console.log("Running extra migrations...");

  const safeRun = async (sql, label) => {
    try { await knex.raw(sql); console.log(`  ✓ ${label}`); }
    catch { console.log(`  - ${label} (skip)`); }
  };

  await safeRun(`CREATE TABLE IF NOT EXISTS bans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, ban_type ENUM('email','ip') NOT NULL,
    ban_value VARCHAR(255) NOT NULL, reason TEXT, banned_by INT UNSIGNED NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL, UNIQUE KEY uq_ban (ban_type, ban_value),
    FOREIGN KEY (banned_by) REFERENCES users(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, "bans");

  await safeRun(`CREATE TABLE IF NOT EXISTS faqs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, category ENUM('client','admin') NOT NULL DEFAULT 'client',
    question TEXT NOT NULL, answer TEXT NOT NULL, sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, "faqs");

  await safeRun("ALTER TABLE users ADD COLUMN failed_login_count TINYINT UNSIGNED DEFAULT 0", "users.failed_login_count");
  await safeRun("ALTER TABLE users ADD COLUMN locked_until DATETIME DEFAULT NULL", "users.locked_until");
  await safeRun("ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE", "users.two_factor_enabled");
  await safeRun("ALTER TABLE users ADD COLUMN two_factor_method ENUM('email','sms') DEFAULT 'email'", "users.two_factor_method");
  await safeRun("ALTER TABLE users ADD COLUMN two_factor_code VARCHAR(6) DEFAULT NULL", "users.two_factor_code");
  await safeRun("ALTER TABLE users ADD COLUMN two_factor_expires DATETIME DEFAULT NULL", "users.two_factor_expires");
  await safeRun("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL", "users.phone");
  await safeRun("ALTER TABLE users ADD COLUMN pending_email VARCHAR(255) DEFAULT NULL", "users.pending_email");
  await safeRun("ALTER TABLE users ADD COLUMN email_change_code VARCHAR(6) DEFAULT NULL", "users.email_change_code");
  await safeRun("ALTER TABLE users ADD COLUMN email_change_expires DATETIME DEFAULT NULL", "users.email_change_expires");
  await safeRun("ALTER TABLE users ADD COLUMN credential_view_code VARCHAR(6) DEFAULT NULL", "users.credential_view_code");
  await safeRun("ALTER TABLE users ADD COLUMN credential_view_expires DATETIME DEFAULT NULL", "users.credential_view_expires");
  await safeRun("ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500) DEFAULT NULL", "orders.payment_proof_url");
  await safeRun("ALTER TABLE orders ADD COLUMN payment_proof_type VARCHAR(10) DEFAULT NULL", "orders.payment_proof_type");
  await safeRun("ALTER TABLE orders ADD COLUMN contract_required BOOLEAN NOT NULL DEFAULT TRUE", "orders.contract_required");
  await safeRun("ALTER TABLE chat_messages ADD COLUMN message_type ENUM('text','image') NOT NULL DEFAULT 'text'", "chat_messages.message_type");
  await safeRun("ALTER TABLE contracts ADD COLUMN dispute_reason TEXT DEFAULT NULL", "contracts.dispute_reason");
  await safeRun("ALTER TABLE contracts ADD COLUMN disputed_at DATETIME DEFAULT NULL", "contracts.disputed_at");
  await safeRun("ALTER TABLE contracts ADD COLUMN disputed_by INT UNSIGNED DEFAULT NULL", "contracts.disputed_by");
  await safeRun("ALTER TABLE contracts MODIFY COLUMN status ENUM('draft','pending_client','pending_admin','fully_signed','voided','disputed','skipped') NOT NULL DEFAULT 'draft'", "contracts.status");

  console.log("Extra migrations done!");
}

module.exports = runMigrations;
