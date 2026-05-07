# Architecture

```
┌────────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  Marketing Site    │       │                     │       │              │
│  (arvid.work)      │       │                     │       │              │
└────────────────────┘       │  Express BFF         │──────▶│  Supabase    │
                             │  (arvid-api)         │  RLS  │  (Postgres)  │
┌────────────────────┐       │                     │       │              │
│  Dashboard App     │──────▶│                     │       │              │
│  (app.arvid.work)  │ /api  │                     │       │              │
└────────────────────┘       └─────────────────────┘       └──────────────┘
```

- **Marketing Site** — React, Vite, Tailwind CSS (separate build, no auth)
- **Dashboard App** — React 18, TypeScript, Tailwind CSS, Zustand, Vite, Supabase Auth
- **BFF** — Express 5, validates with Zod, per-request Supabase clients with user JWT for RLS
- **Database** — Supabase (Postgres with RLS, user-scoped via `projects.user_id`)

The dashboard app calls Supabase Auth directly for sign-in/sign-up/OAuth. All data flows through `/api/*` with a Bearer JWT.

## Two Vite Builds

| Build | Config | Entry | Output | Domain |
|-------|--------|-------|--------|--------|
| Dashboard + login | `vite.config.ts` | `src/main.tsx` | `dist/` | `app.arvid.work` |
| Marketing site | `vite.config.site.ts` | `src/site/main.tsx` | `dist-site/` | `arvid.work` |

## Client Layers

| Layer | Responsibility | Location |
|-------|---------------|----------|
| UI | Rendering and interaction | `src/app/components/` |
| State | Global state and transitions | `src/app/store/` |
| Domain | Business rules, path building | `src/app/domain/` |
| Infrastructure | HTTP, auth adapters | `src/app/api.ts`, `src/app/lib/supabase.ts` |
| Routing | URL-to-store sync, navigation | `WorkspaceLayout`, `WorkspaceRedirect` |
| Auth | Session, user context, route guards | `src/app/auth/` |

## URL-Based Routing

The browser URL encodes the full navigation context using short IDs:

```
/:wsShortId/:teamShortId/:projectShortId
```

| Segment | Example | Source |
|---------|---------|--------|
| Workspace | `W01` | `workspaces.short_id` |
| Team | `T01` | `teams.short_id` |
| Project | `P01` | `projects.short_id` |

Examples: `/W01/T01/P01`, `/W02/T01/P03`

The URL is the **single source of truth** for navigation. The store reflects it but does not own it. Flow: URL change -> `WorkspaceLayout` reads params -> store actions -> components render. Path construction is centralized in `src/app/domain/paths.ts`.

## Short ID System

Every entity in the hierarchy gets a human-readable short ID with a single-letter prefix:

| Entity | Prefix | Scope |
|--------|--------|-------|
| Workspace | W | Per user |
| Team | T | Per workspace |
| Project | P | Per user |
| Requirement | R | Per project |
| Question | Q | Per requirement |
| Answer | A | Per question |
| Summary | S | Per requirement |

Full address of a requirement: `W01/T01/P01/R03`

## Authentication

- **Supabase Auth** on the frontend (`src/app/lib/supabase.ts`)
- **AuthProvider** (`src/app/auth/AuthProvider.tsx`) — React context, listens to `onAuthStateChange`, exposes `user`, `session`, `signOut`
- **AuthGuard** (`src/app/auth/AuthGuard.tsx`) — redirects to `/login` if unauthenticated
- **Login page** at `app.arvid.work/login` — email/password + GitHub/Google OAuth
- **BFF auth middleware** (`server/middleware/requireAuth.ts`) — verifies JWT, attaches `req.user` and `req.accessToken`
- **Per-request Supabase client** (`server/supabase.ts:createUserClient`) — scoped to user's JWT for RLS enforcement

## State Management

Zustand store with slices:

- **Workspaces** (`store/slices/workspaces.ts`) — workspace, team, and membership CRUD; active workspace selection
- **Entities** (`store/slices/entities.ts`) — requirements, questions, answers, data-loading state machine, mutations
- **Selection** (`store/slices/selection.ts`) — selected requirement, question, project
- **Projects** (`store/slices/projects.ts`) — project CRUD backed by API, workspace-scoped loading
- **Summaries** (`store/slices/summaries.ts`) — AI-generated summary cache, generation triggers

Data loading uses an explicit state machine (`idle → loading → ready | error`). Derived data is computed via `useMemo`, never stored separately.

## Real-Time Data

**Rule: prefer streaming over polling.** When external systems modify data (e.g. Linear webhook updates a requirement status), the frontend must reflect changes instantly without page refreshes or timed intervals.

**Pattern: Supabase Realtime → Zustand refresh**

1. Enable Realtime on the table: `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;`
2. Subscribe to `postgres_changes` events via the frontend Supabase client
3. On change, call a lightweight store action that re-fetches the affected data silently (no loading spinners, no state reset)
4. Clean up the channel subscription on component unmount

Current Realtime subscriptions:

- **`requirements`** — listens for `UPDATE` events to sync Linear status changes pushed by webhooks (`App.tsx` → `refreshRequirements`)

**When to use Realtime vs. fetch-on-action:**

- **Realtime** — data modified by external systems (webhooks, other users, background jobs)
- **Fetch-on-action** — data modified by the current user's own actions (create, update, delete) where the response already contains the new state

## Schema Validation

Zod schemas in `shared/schemas/` are the single source of truth, consumed by both client and server.

Each entity has:
1. **Row Schema** — matches DB columns (snake_case)
2. **Domain Schema** — transforms to camelCase for the client
3. **Mutation Schemas** — validates request bodies on the server

| Boundary | Validated | Schema |
|----------|----------|--------|
| Server ingress | `req.body` via middleware | `Create*BodySchema`, `Update*BodySchema` |
| Client response | Every fetch response | `RequirementSchema`, `QuestionSchema`, `AnswerSchema` |

## API Endpoints

All endpoints (except `/api/health`) require `Authorization: Bearer <jwt>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (no auth) |
| GET | `/api/workspaces` | List workspaces for current user |
| GET | `/api/workspaces/:id` | Get one workspace |
| POST | `/api/workspaces` | Create workspace (+ default team + owner membership) |
| PATCH | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Soft-delete workspace (cascades to teams/projects) |
| GET | `/api/teams?workspace_id=` | List teams in workspace |
| GET | `/api/teams/:id` | Get one team |
| POST | `/api/teams` | Create team |
| PATCH | `/api/teams/:id` | Update team |
| DELETE | `/api/teams/:id` | Soft-delete team (cascades to projects) |
| GET | `/api/memberships?workspace_id=` | List workspace members |
| POST | `/api/memberships` | Add member by email |
| PATCH | `/api/memberships/:id` | Update member role |
| DELETE | `/api/memberships/:id` | Remove member |
| GET | `/api/projects?workspace_id=` | List projects (filterable by workspace) |
| GET | `/api/projects/:id` | Get one project |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Soft-delete project |
| GET | `/api/requirements?project_id=` | List (filterable by project) |
| GET | `/api/requirements/:id` | Get one |
| POST | `/api/requirements` | Create |
| PATCH | `/api/requirements/:id` | Update |
| DELETE | `/api/requirements/:id` | Delete |
| GET | `/api/questions?requirement_id=` | List (filterable) |
| POST | `/api/questions` | Create |
| PATCH | `/api/questions/:id` | Update |
| GET | `/api/answers?question_id=` | List (filterable) |
| POST | `/api/answers` | Create |
| POST | `/api/answers/suggest/:questionId` | Generate AI-suggested answer |
| PATCH | `/api/answers/:id` | Update |
| GET | `/api/summaries?requirement_id=` | Get cached summary |
| POST | `/api/summaries/generate/:requirementId` | Generate AI summary |

## Database

Eight core tables with RLS enabled, scoped via workspace membership:

- **workspaces** — id, name, slug, created_by, created_at, is_deleted, deleted_at
- **workspace_memberships** — id, workspace_id (FK), user_id (FK to auth.users), role (owner/admin/member), joined_at
- **teams** — id, workspace_id (FK), name, slug, created_by, created_at, is_deleted, deleted_at
- **projects** — id, name, parent_id (self-FK), user_id, workspace_id (FK), team_id (FK), is_deleted, deleted_at, created_at
- **requirements** — id, title, source, owner, owner_team, owner_role, created_at, description, completeness, clarity, risk, project_id (FK)
- **questions** — id, requirement_id (FK), text, status, importance, type, category, is_suggested, is_hidden, author, author_team, author_role, created_at, description
- **answers** — id, question_id (FK), text, author, date, is_current, is_suggested, is_hidden
- **summaries** — id, requirement_id (unique FK), synthesis, core_objective, architecture, constraints, unverified_risks, model, generated_at

RLS policies enforce workspace-based isolation: `workspaces`, `teams`, and `projects` check membership via `workspace_memberships`. Child tables (requirements, questions, answers, summaries) still join back to `projects` to verify ownership. Soft-delete is enforced via `is_deleted` + `deleted_at` on workspaces, teams, and projects.

## Environment Variables

| Variable | Where | Required |
|----------|-------|----------|
| `SUPABASE_URL` | Server | Yes |
| `SUPABASE_KEY` | Server | Yes |
| `OPENROUTER_API_KEY` | Server | Yes (for AI summaries) |
| `PORT` | Server | No (default 3001) |
| `SITE_ORIGIN` | Server | Yes (CORS) |
| `APP_ORIGIN` | Server | Yes (CORS) |
| `VITE_API_BASE` | Dashboard build | No (default `/api`) |
| `VITE_SUPABASE_URL` | Dashboard build | Yes |
| `VITE_SUPABASE_ANON_KEY` | Dashboard build | Yes |
| `VITE_APP_URL` | Marketing site build | No (default `http://localhost:5173`) |

Locally: set in `.env` (loaded via `--env-file`). On Render: set in Dashboard per `render.yaml`.

## Key Files

```
shared/schemas/       Zod schemas shared by client and server
supabase/migrations/  Database migration SQL files
server/
  index.ts            Express entry point, CORS, auth middleware
  supabase.ts         Supabase client (service-role + per-request factory)
  context.ts          Requirement context aggregator for AI
  middleware/
    requireAuth.ts    JWT verification middleware
    validateBody.ts   Zod body validation
  routes/             CRUD route handlers (per-request Supabase clients)
    workspaces.ts     Workspace CRUD + default team/membership creation
    teams.ts          Team CRUD
    memberships.ts    Workspace membership CRUD
src/app/
  lib/
    supabase.ts       Frontend Supabase client
    constants.ts      App-level constants from env vars
  auth/
    AuthProvider.tsx   Auth context (user, session, signOut)
    AuthGuard.tsx      Route guard (redirects to /login)
  pages/
    LoginPage.tsx      Login/signup page
  api.ts              Fetch client with Zod parsing + Bearer JWT
  store/              Zustand store and slices
  domain/             Pure business logic
  components/         UI layer
src/site/
  main.tsx            Marketing site entry
  pages/              Landing page
  components/         TopNav, HeroSection
render.yaml           Render Blueprint (3 services)
vite.config.ts        Dashboard app build
vite.config.site.ts   Marketing site build
```
