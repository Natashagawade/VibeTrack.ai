require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: {} });
  const client = await pool.connect();
  try {
    // Backfill: copy metadata.dedupeHash -> dedupeHash column for all existing signals
    const backfill = await client.query(`
      UPDATE "CustomerSignal"
      SET "dedupeHash" = "metadata"->>'dedupeHash'
      WHERE "dedupeHash" IS NULL
        AND "metadata"->>'dedupeHash' IS NOT NULL
    `);
    console.log(`Backfilled dedupeHash column for ${backfill.rowCount} signals`);

    // Verify: check for any nulls remaining
    const nulls = await client.query(`
      SELECT COUNT(*)::int AS cnt FROM "CustomerSignal" WHERE "dedupeHash" IS NULL
    `);
    console.log(`Signals still without dedupeHash: ${nulls.rows[0].cnt}`);

    // Verify: check for any duplicates that the backfill would catch
    const dupes = await client.query(`
      SELECT "orgId", "dedupeHash", COUNT(*)::int AS cnt
      FROM "CustomerSignal"
      WHERE "dedupeHash" IS NOT NULL
      GROUP BY "orgId", "dedupeHash"
      HAVING COUNT(*) > 1
    `);
    console.log(`Duplicate dedupeHashes found: ${dupes.rows.length}`);
    if (dupes.rows.length > 0) {
      console.log("(first 5):", dupes.rows.slice(0, 5));
    }
  } catch (e) {
    console.error("Backfill failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});