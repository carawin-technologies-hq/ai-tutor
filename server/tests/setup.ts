// Load server/.env for tests (DATABASE_URL, ADMIN_EMAIL/ADMIN_PASSWORD, secrets).
try { process.loadEnvFile(".env"); } catch {}
process.env.NODE_ENV = "test";
