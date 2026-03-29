"use strict";

/**
 * Simple migration runner.
 * Reads .sql files from /migrations in alphabetical order.
 * Tracks applied migrations in a `_migrations` table.
 */
const fs = require("fs");
const path = require("path");
const knex = require("./knex");

const MIGRATIONS_DIR = path.join(__dirname, "../../migrations");

async function migrate() {
  // Ensure migrations table exists
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = await knex("_migrations").select("name").orderBy("name");
  const appliedSet = new Set(applied.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

    // Split on semicolons for multi-statement files
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await knex.raw(stmt);
    }

    await knex("_migrations").insert({ name: file });
    count++;
  }

  console.log(count > 0 ? `Applied ${count} migration(s).` : "No new migrations.");
  await knex.destroy();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
