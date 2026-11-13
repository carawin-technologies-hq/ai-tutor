# CARAWIN AI TUTOR — API server

TypeScript **Express 5** API with **PostgreSQL** (Prisma 7) and the **Claude API** for the AI teacher.
It runs as its own service next to the Next.js app (`../`).

## Setup

```bash
cd server
npm install
cp .env.example .env        # then fill it in (see below)
npm run db:generate         # generate the database client
npm run db:deploy           # create the tables (use db:migrate while changing the schema)
npm run db:seed             # starter content + first admin account
npm run dev                 # http://localhost:4000
```

### Database

* **Cloud (recommended): Neon** — create a free project at neon.tech, copy the connection string
  (Dashboard → Connect) into `DATABASE_URL` in `.env`, e.g.
  `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.
* **On this computer, no Docker:** `npm run db:local` starts a real PostgreSQL in `server/.local-db`
  and prints its `DATABASE_URL` (`postgresql://postgres:postgres@localhost:5433/carawin`). Keep it running while you work.

### Keys and settings (`.env`)

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | 32+ random characters for signing sign-in tokens |
| `FRONTEND_ORIGIN` | The web app's URL(s), comma-separated (CORS + cookies) |
| `GOOGLE_CLIENT_ID` | Google sign-in (OAuth client ID, "Web application"). Empty = Google sign-in off |
| `ANTHROPIC_API_KEY` | Claude API key for the AI teacher. Empty = chat returns `503 ai_not_configured` |
| `CLAUDE_MODEL` | Default `claude-opus-5-5` |
| `CHAT_DAILY_LIMIT` | Teacher answers per student per day (cost control) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin account, created by `npm run db:seed` |

### Tests

`npm test` runs end-to-end API tests against the database in `.env` (seed it first). Test accounts are removed afterwards.

## How it works

* **Sign-in:** email + password (bcrypt) or Google. A 15-minute access token is returned in JSON and sent as
  `Authorization: Bearer …`; a 30-day refresh token lives in an httpOnly cookie on `/api/v1/auth`, is rotated on every
  refresh, and reuse of an old one signs out every session. Students and parents can self-register; admins are created by
  the seed or by another admin.
* **Parent ↔ child:** every student has an 8-character invite code (Settings); a parent enters it to link. Parents can
  only read reports of linked children.
* **Practice & tests:** questions are served **without answers**; answers are graded on the server (same rules as the app).
  Practice gives instant feedback; tests reveal answers only after submitting and notify linked parents.
* **Progress:** subject scores, chapter mastery, weekly minutes, monthly trend, test history and streaks are computed from
  real attempts, lessons, videos and chats.
* **AI teacher:** `POST /chat/...` sends the conversation and the student's profile (class, board, teaching style) to Claude,
  which returns whiteboard blocks (headings, paragraphs, lists, formulas, tables, examples, follow-up question, diagrams) in
  a validated structured format. If a safety check declines on the main model, the API automatically retries on a fallback
  model (`fallbacks: "default"`). Per-minute and per-day limits protect your API budget.

All responses are JSON. Errors look like `{ "error": { "code": "bad_request", "message": "…", "details": [...] } }`.

## Endpoints (`/api/v1`)

| Area | Method & path | Who |
|---|---|---|
| Auth | `POST /auth/register` `{name,email,password,role: STUDENT\|PARENT}` · `POST /auth/login` · `POST /auth/google` `{credential, role?}` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/change-password` | anyone / signed in |
| Student | `GET·PUT /students/me/profile` · `POST /students/me/invite-code` (new code) · `GET /students/me/parents` · `DELETE /students/me/parents/:id` · `GET /students/me/progress` · `GET·POST /students/me/tasks` · `PATCH·DELETE /students/me/tasks/:id` | student |
| Parent | `POST /parents/me/children` `{code}` · `GET /parents/me/children` · `DELETE /parents/me/children/:id` · `GET /parents/me/children/:id/report` · `GET /parents/me/children/:id/tasks` | parent |
| Learning | `GET /curriculum` · `GET /lessons` · `GET /lessons/:id` · `POST /lessons/:id/progress` · `GET /videos` · `GET /videos/:id` · `POST /videos/:id/watched` · `GET·POST /library` · `GET·DELETE /library/:id` · `PUT /library/:id/favorite` | signed in |
| Notifications | `GET /notifications` · `POST /notifications/:id/read` · `POST /notifications/read-all` | signed in |
| Practice & tests | `POST /practice` `{subject, chapterId?, topicId?, difficulty?, types?, count}` · `GET /assessments` · `POST /assessments/:id/attempts` · `POST /attempts/:id/answers` · `POST /attempts/:id/submit` · `GET /attempts` · `GET /attempts/:id` | student |
| AI teacher | `GET·POST /chat/conversations` · `GET·PATCH·DELETE /chat/conversations/:id` · `POST /chat/conversations/:id/messages` `{text}` · `DELETE /chat/conversations/:id/messages` · `PATCH /chat/messages/:id` `{saved}` · `GET /chat/saved` | student |
| Admin | `GET /admin/stats` · `GET·POST /admin/users` · `PATCH /admin/users/:id` · `/admin/chapters` · `/admin/topics` · `/admin/questions` (+ `PATCH /:id/status`) · `/admin/assessments` · `/admin/lessons` · `/admin/videos` · `/admin/library` · `/admin/content` · `GET /admin/settings` · `PUT /admin/settings/:key` | admin |

Plus `GET /health` (database check; shows whether AI and Google sign-in are configured).

## Not built yet

* File uploads for the library (documents are text pages or a `fileUrl` for now).
* Password-reset emails and email verification (needs an email provider).
* Streaming the teacher's answer word-by-word (answers arrive complete).
* The Next.js app still uses its demo data; it needs to be connected to these endpoints.
