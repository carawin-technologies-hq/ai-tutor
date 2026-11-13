# CARAWIN AI TUTOR — Frontend Prototype

Frontend-only prototype (Next.js 14 App Router · React · TypeScript · Tailwind · Framer Motion · Recharts · React Hook Form + Zod · Lucide).
**No backend, no database, no real authentication, no AI/OCR/speech/payment APIs.** All AI behaviour is scripted; all data is demonstration data stored in `localStorage`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
# or production check
npm run build \&\& npm start
```

Sign in on the **homepage** (Student, Parent or Admin tab in the sign-in card) against the API server in `server/` — start it first. Students and parents can create an account there; the admin is created by `npm run db:seed`. Each portal needs the matching account. The API URL defaults to `http://localhost:4000/api/v1` (set `NEXT_PUBLIC_API_URL` to change it). After sign-in, pages still show demonstration data.

## Structure

* `src/app` — routes (`/`, `/onboarding`, `/student/\*`, `/parent/\*`, `/admin/\*`)
* `src/components` — ui primitives, layout (PortalShell), landing, dashboard, shared
* `src/features` — learning, assessment, library, planner, history, progress, parent, admin, labs, settings, onboarding
* `src/data` — all mock datasets (students, curriculum, lessons, questions, progress, conversations, library, videos, admin)

## Simulated / limited (by design)

Lesson content is fully interactive for *Class 8 Maths › Linear Equations* (3 lessons); other chapters show outline previews. Chat has scripted answers for a handful of topics. Doubt solver returns one of two sample solutions. Voice, OCR, document processing, handwriting recognition, PDF export, video playback, offline downloads and writing/career/oral-exam evaluation are simulated. Only English and sample Hindi are demonstrated; the other scheduled languages are listed with illustrative status.


## 3D teacher avatar

The *Talk to My Teacher* page shows a realistic 3D teacher (`src/features/learning/TeacherAvatar3D.tsx`) that reads answers aloud with the browser's speech engine and lip-syncs using the model's visemes.
Model and textures: **Microsoft Rocketbox** `Business_Female_01` (MIT licence — `public/avatars/teacher/LICENSE-Rocketbox.md`). To use another Rocketbox character, replace the files in `public/avatars/teacher/` with its `*_facial.fbx` and converted textures.

### Teacher voice

Pick a voice from the **Voice** menu on *Talk to My Teacher*:

* **Natural voices (Piper)** — Jenny, Cori, Lessac, Amy, Kusal (Indian-accented English). They run fully on the student's device via [`@mintplex-labs/piper-tts-web`](https://github.com/Mintplex-Labs/piper-tts-web) (ONNX Runtime Web) in a background worker (`src/features/learning/piper.worker.ts`). Each voice downloads once from Hugging Face (about 60–115 MB) and is stored in the browser's private file storage; after that it works offline. Speech is generated sentence by sentence, and each sentence's audio length drives the lip-sync and the whiteboard writing.
* **Browser voice** — the built-in speech engine; instant but more robotic. Used only if you pick it, or if the natural voice can't load (the teacher waits for the natural voice while it downloads).

Piper's code is MIT-licensed, but each voice is trained on its own dataset with its own licence (some are non-commercial). Check each voice's MODEL_CARD on Hugging Face before commercial use.

### Teaching at the whiteboard

On *Talk to My Teacher* the 3D teacher stands beside a large whiteboard and teaches like a real teacher: she writes and draws each part of the answer, points at it with her index finger, turns between the board and the students, and uses natural hand gestures while explaining (open palms, offering a point, counting, beats in time with her words, hands together when listening, hand to chin when thinking). Gestures are generated procedurally on the model's skeleton (`TeacherAvatar3D.tsx`), so no animation files are downloaded. Her lips follow the actual loudness of the natural voice.

## Backend

The API server lives in [`server/`](server/README.md): Express + PostgreSQL (Prisma) + Claude API, with accounts and roles,
parent linking, practice/tests with server-side grading, progress, admin content tools and the AI teacher chat.
See `server/README.md` for setup.
