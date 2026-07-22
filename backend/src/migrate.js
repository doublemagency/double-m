import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "./config.js";
const admin = await mysql.createConnection({
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  multipleStatements: true,
});
await admin.query(
  `CREATE DATABASE IF NOT EXISTS \`${config.DATABASE_NAME.replaceAll("`", "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await admin.changeUser({ database: config.DATABASE_NAME });
const [[existingSchema]] = await admin.query(
  "SELECT COUNT(*) total FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='users'",
  [config.DATABASE_NAME],
);
const initial = await fs.readFile(
  new URL("../sql/001_initial.sql", import.meta.url),
  "utf8",
);
await admin.query(initial);
await admin.query(
  "CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(120) NOT NULL PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
);
await admin.query(
  "INSERT IGNORE INTO schema_migrations(filename) VALUES('001_initial.sql')",
);
if (existingSchema.total) {
  await admin.query(
    "INSERT IGNORE INTO schema_migrations(filename) VALUES('002_operations.sql'),('003_admin_commerce.sql')",
  );
}
const [columns] = await admin.query(
  "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='force_password_change'",
  [config.DATABASE_NAME],
);
if (!columns.length)
  await admin.query(
    "ALTER TABLE users ADD COLUMN force_password_change BOOLEAN NOT NULL DEFAULT FALSE",
  );
for (const file of [
  "002_operations.sql",
  "003_admin_commerce.sql",
  "004_workflow_integrity.sql",
  "005_fee_band_integrity.sql",
]) {
  const [[applied]] = await admin.query(
    "SELECT COUNT(*) total FROM schema_migrations WHERE filename=?",
    [file],
  );
  if (applied.total) continue;
  const sql = await fs.readFile(
    new URL(`../sql/${file}`, import.meta.url),
    "utf8",
  );
  await admin.beginTransaction();
  try {
    await admin.query(sql);
    await admin.query("INSERT INTO schema_migrations(filename) VALUES(?)", [
      file,
    ]);
    await admin.commit();
  } catch (error) {
    await admin.rollback();
    throw error;
  }
}
await admin.end();
console.log("Database schema is current.");
