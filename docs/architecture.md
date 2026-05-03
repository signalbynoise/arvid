# Architecture

```
┌────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  React SPA     │──────▶│  Express BFF         │──────▶│  Supabase    │
│  (Vite :5173)  │ /api  │  (localhost:3001)    │  SQL  │  (Postgres)  │
└────────────────┘       └─────────────────────┘       └──────────────┘
```

- **Frontend** — React 18, TypeScript, Tailwind CSS, Zustand, Vite
- **BFF** — Express 5, validates with Zod, proxies all DB access
- **Database** — Supabase (Postgres with RLS)

The frontend never calls the database directly. All data flows through `/api/*`.

## Client Layers

| Layer | Responsibility | Location |
|-------|---------------|----------|
| UI | Rendering and interaction | `src/app/components/` |
| State | Global state and transitions | `src/app/store/` |
| Domain | Business rules and invariants | `src/app/domain/` |
| Infrastructure | HTTP and adapters | `src/app/api.ts` |

## State Management

Zustand store with three slices:

- **Entities** (`store/slices/entities.ts`) — requirements, questions, answers, data-loading state machine, mutations
- **Selection** (`store/slices/selection.ts`) — selected requirement, question, project
- **Projects** (`store/slices/projects.ts`) — project tree and CRUD

Data loading uses an explicit state machine (`idle → loading → ready | error`). Derived data is computed via `useMemo`, never stored separately.

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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/requirements` | List all |
| GET | `/api/requirements/:id` | Get one |
| POST | `/api/requirements` | Create |
| PATCH | `/api/requirements/:id` | Update |
| DELETE | `/api/requirements/:id` | Delete |
| GET | `/api/questions?requirement_id=` | List (filterable) |
| PATCH | `/api/questions/:id` | Update |
| GET | `/api/answers?question_id=` | List (filterable) |
| PATCH | `/api/answers/:id` | Update |

## Database

Three tables with RLS enabled:

- **requirements** — id, title, source, owner, owner_team, owner_role, created_at, description, completeness, clarity, risk
- **questions** — id, requirement_id (FK), text, status, importance, type, category, is_suggested, is_hidden, author, author_team, author_role, created_at, description
- **answers** — id, question_id (FK), text, author, date, is_current

## Environment Variables

| Variable | Where | Required |
|----------|-------|----------|
| `SUPABASE_URL` | Server | Yes |
| `SUPABASE_KEY` | Server | Yes |
| `PORT` | Server | No (default 3001) |
| `VITE_API_BASE` | Frontend build | No (default `/api`) |

Locally: set in `.env` (loaded via `--env-file`). On Render: set in Dashboard per `render.yaml`.

## Key Files

```
shared/schemas/       Zod schemas shared by client and server
server/
  index.ts            Express entry point
  supabase.ts         Supabase client
  middleware/          Request validation
  routes/             CRUD route handlers
src/app/
  api.ts              Fetch client with Zod parsing
  store/              Zustand store and slices
  domain/             Pure business logic
  components/         UI layer
render.yaml           Render Blueprint (static site + API)
```
