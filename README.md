# Northstar Demo Bank

Demo banking app built with Next.js 16, React 19, and a SQLite-backed server runtime.

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo accounts:

- `theo@northstar-demo.bank` / `DemoBank#2026`
- `ava@northstar-demo.bank` / `DemoFamily#2026`
- `ops@northstar-demo.bank` / `AdminOps#2026`

Demo OTP:

- `246810`

## Environment

Copy `.env.example` to `.env.local` for local overrides.

Supported variables:

- `NEXT_PUBLIC_APP_NAME`
- `BANKING_DEMO_OTP`
- `BANKING_SEED_DEMO`
- `BANKING_DATA_DIR`
- `BANKING_DB_PATH`

## Demo deployment

This project is ready for a single-instance demo deployment.

Recommended host:

- `Render` web service with a persistent disk

Why:

- the app uses a SQLite database file
- a persistent disk keeps demo accounts and transactions between deploys
- the current setup is simple and does not require moving to PostgreSQL yet

### Render setup

1. Push this project to GitHub.
2. Create a new `Web Service` in Render.
3. Use:

```bash
npm install
```

for the build command.

4. Use:

```bash
npm run start
```

for the start command.

5. Add a persistent disk and mount it at:

```bash
/var/data/northstar
```

6. Set environment variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Northstar Demo Bank
BANKING_DEMO_OTP=246810
BANKING_SEED_DEMO=true
BANKING_DATA_DIR=/var/data/northstar
```

7. Deploy.

The app will create the SQLite file on first boot and seed demo data automatically if the database is empty.

## Health check

Use:

```bash
/api/health
```

Expected JSON includes the app name, status, and database path.

## Notes

- This is suitable for a public demo, not a real banking launch.
- The SQLite warning during build comes from Node's built-in SQLite module and is expected.
- For a more scalable deployment later, the next step is migrating storage to PostgreSQL.
