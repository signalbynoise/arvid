# Arvid — Architecture & Setup

## Architecture

```
┌────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  React SPA     │──────▶│  Express BFF         │──────▶│  Supabase    │
│  (Vite :5173)  │ /api  │  (localhost:3001)    │  SQL  │  (Postgres)  │
└────────────────┘       └─────────────────────┘       └──────────────┘
```

- **Frontend** — React 18 + TypeScript + Tailwind CSS (Vite dev server)
- **BFF (Backend-For-Frontend)** — Express server that owns all database communication
- **Database** — Supabase (hosted Postgres with RLS enabled)

The frontend never calls the database directly. All data flows through `/api/*` endpoints served by the BFF.

Vite proxies `/api` requests to the BFF in development.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/requirements` | List all requirements |
| GET | `/api/requirements/:id` | Get single requirement |
| POST | `/api/requirements` | Create requirement |
| PATCH | `/api/requirements/:id` | Update requirement |
| DELETE | `/api/requirements/:id` | Delete requirement |
| GET | `/api/questions?requirement_id=` | List questions (optionally filtered) |
| GET | `/api/questions/:id` | Get single question |
| POST | `/api/questions` | Create question |
| PATCH | `/api/questions/:id` | Update question |
| DELETE | `/api/questions/:id` | Delete question |
| GET | `/api/answers?question_id=` | List answers (optionally filtered) |
| GET | `/api/answers/:id` | Get single answer |
| POST | `/api/answers` | Create answer |
| PATCH | `/api/answers/:id` | Update answer |
| DELETE | `/api/answers/:id` | Delete answer |

## Database Schema

Three tables in the `public` schema with RLS enabled:

- **requirements** — id, title, source, owner, owner_team, owner_role, created_at, description, completeness, clarity, risk
- **questions** — id, requirement_id (FK), text, status, importance, type, category, is_suggested, is_hidden, author, author_team, author_role, created_at, description
- **answers** — id, question_id (FK), text, author, date, is_current

Enums: `clarity_level`, `risk_level`, `question_status`, `importance_level`, `question_type`, `question_category`.

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the BFF server (port 3001)
npm run server

# 3. Start the frontend dev server (port 5173)
npm run dev
```

Both must be running simultaneously. The Vite dev server proxies `/api` to the BFF.

## Environment Variables (optional overrides)

The BFF reads these from the environment (defaults are set for the current project):

| Variable | Default |
|----------|---------|
| `PORT` | `3001` |
| `SUPABASE_URL` | `https://hjadkzfemzuvhpwbixbt.supabase.co` |
| `SUPABASE_KEY` | *(publishable key embedded in code)* |

## Key Files

```
server/
  index.ts          — Express entry point
  supabase.ts       — Supabase client init
  routes/
    requirements.ts — /api/requirements CRUD
    questions.ts    — /api/questions CRUD
    answers.ts      — /api/answers CRUD
src/app/
  api.ts            — Frontend fetch client (snake_case ↔ camelCase mapping)
  types.ts          — Shared TypeScript types
  App.tsx           — Main app (loads data from API)
vite.config.ts      — Includes /api proxy to BFF
```
