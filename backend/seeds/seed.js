"use strict";

const bcrypt = require("bcryptjs");
const Knex = require("knex");

async function seed() {
  const knex = Knex({
    client: "mysql2",
    connection: {
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306", 10),
      user: process.env.MYSQL_USER || "anubisboost",
      password: process.env.MYSQL_PASSWORD || "changeme_dev_only",
      database: process.env.MYSQL_DATABASE || "anubisboost",
    },
  });

  console.log("Seeding database...");

  // Roles
  await knex.raw(`INSERT IGNORE INTO roles (id, name, description) VALUES
    (1, 'admin', 'Full system access'),
    (2, 'collaborator', 'Assigned orders access'),
    (3, 'client', 'Customer access')`);

  // Permissions
  const perms = [
    "catalog:manage", "users:manage", "orders:list_all", "orders:create",
    "orders:update_status", "orders:assign", "credentials:view", "credentials:upload",
    "contracts:create", "contracts:sign_admin", "contracts:sign_client",
    "payments:manage", "chat:send", "notifications:read",
    "audit_logs:view", "admin:dashboard", "orders:list_assigned",
    "orders:post_progress",
  ];
  for (const p of perms) {
    await knex.raw("INSERT IGNORE INTO permissions (name) VALUES (?)", [p]);
  }

  // Fetch permission IDs
  const permRows = await knex("permissions").select("id", "name");
  const permMap = {};
  for (const r of permRows) permMap[r.name] = r.id;

  // Role-Permission mappings
  const adminPerms = Object.keys(permMap);
  const collabPerms = [
    "orders:list_assigned", "orders:update_status", "orders:post_progress",
    "credentials:view", "chat:send", "notifications:read",
  ];
  const clientPerms = [
    "orders:create", "credentials:upload", "contracts:sign_client",
    "chat:send", "notifications:read",
  ];

  for (const p of adminPerms) {
    if (permMap[p]) await knex.raw("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)", [permMap[p]]);
  }
  for (const p of collabPerms) {
    if (permMap[p]) await knex.raw("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, ?)", [permMap[p]]);
  }
  for (const p of clientPerms) {
    if (permMap[p]) await knex.raw("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (3, ?)", [permMap[p]]);
  }

  // Admin user
  const hash = await bcrypt.hash("Admin123!", 12);
  await knex.raw(
    `INSERT IGNORE INTO users (role_id, email, username, password_hash, is_active, email_verified)
     VALUES (1, 'admin@anubisboost.com', 'admin', ?, TRUE, TRUE)`,
    [hash]
  );

  // Sample platforms
  await knex.raw(`INSERT IGNORE INTO platforms (name, slug) VALUES
    ('PC', 'pc'), ('PlayStation 5', 'ps5'), ('Xbox Series X', 'xbox-sx'),
    ('Nintendo Switch', 'switch'), ('Mobile', 'mobile')`);

  // Sample service types
  await knex.raw(`INSERT IGNORE INTO service_types (name, slug, description) VALUES
    ('Rank Boost', 'rank-boost', 'Boost your competitive rank'),
    ('Leveling', 'leveling', 'Level up your account or character'),
    ('Coaching', 'coaching', 'Personal coaching sessions'),
    ('Placement Matches', 'placement-matches', 'Complete placement matches'),
    ('Achievement', 'achievement', 'Unlock specific achievements')`);

  // Default contract policy
  await knex.raw(`INSERT IGNORE INTO contract_policies (name, content_template, is_default, is_active) VALUES
    ('Standard Boosting Contract', '<h2>Boosting Service Agreement</h2>
<p>This agreement is between <strong>AnubisBoost</strong> (Service Provider) and the <strong>Client</strong>.</p>
<h3>Terms</h3>
<ol>
<li>The Service Provider agrees to perform the boosting service as described.</li>
<li>The Client provides valid account credentials for the duration of the service.</li>
<li>Neither party shall change the account password during the service period.</li>
<li>The Service Provider shall not retain or misuse the Client account after completion.</li>
<li>The Client agrees to wait for delivery before using the account.</li>
<li>Scheduled usage dates: {{scheduled_dates}}</li>
</ol>
<h3>Confidentiality</h3>
<p>Both parties maintain strict confidentiality of all account information exchanged.</p>', TRUE, TRUE)`);

  console.log("Seeding complete!");
  console.log("  Admin: admin@anubisboost.com / Admin123!");
  await knex.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
