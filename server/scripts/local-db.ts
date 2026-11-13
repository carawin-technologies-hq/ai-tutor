/**
 * Runs a real PostgreSQL server on this computer (no Docker needed) for local development.
 *   npm run db:local
 * Then use: DATABASE_URL="postgresql://postgres:postgres@localhost:5433/carawin"
 * Data is kept in server/.local-db between runs. Press Ctrl+C to stop.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const PORT = Number(process.env.LOCAL_DB_PORT ?? 5433);
const dir = new URL("../.local-db", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const pg = new EmbeddedPostgres({
  databaseDir: dir, user: "postgres", password: "postgres", port: PORT, persistent: true,
  // UTF-8 everywhere (Windows would otherwise default to WIN1252 and reject symbols like "−" or Hindi text).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

const fresh = !existsSync(dir);
if (fresh) await pg.initialise();
await pg.start();
if (fresh) {
  const client = pg.getPgClient();
  await client.connect();
  await client.query("CREATE DATABASE carawin ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0");
  await client.end();
}

console.log(`\nLocal PostgreSQL is running.\nDATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/carawin"\nPress Ctrl+C to stop.\n`);

const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
