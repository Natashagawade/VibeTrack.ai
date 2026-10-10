require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const MIGRATION_NAME = "20260905020000_business_memory";
const SQL_PATH = `prisma/migrations/${MIGRATION_NAME}/migration.sql`;

async function main() {
  const sql = fs.readFileSync(SQL_PATH, "utf8");
  const checksum = crypto.createHash("sha256").update(sql, "utf8").digest("hex");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: {} });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(sql);
    console.log("Migration DDL executed successfully");

    const migrationId = crypto.randomUUID();
    const statementCount = (sql.match(/^-- /gm) || []).length;
    await client.query(
      `INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count, rolled_back_at, logs)
       VALUES ($1, $2, $3, NOW(), NOW(), $4, NULL, NULL)`,
      [migrationId, checksum, MIGRATION_NAME, statementCount]
    );

    await client.query("COMMIT");
    console.log("Migration record inserted:", migrationId);
    console.log("Checksum:", checksum);
    console.log("Statement count:", statementCount);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});