# Arvid

Requirements management tool. React frontend with an Express BFF server backed by Supabase.

## Local Setup

```bash
cp .env.example .env   # fill in SUPABASE_URL and SUPABASE_KEY
npm install
npm run dev:all        # starts both frontend (:5173) and API server (:3001)
```

## Architecture

```
Browser → React SPA (Vite) → /api → Express BFF → Supabase (Postgres)
```

See [docs/architecture.md](docs/architecture.md) for full details.

## Deployment

Infrastructure is defined in `render.yaml` (Render Blueprint). Two services:

| Service | Type | URL |
|---------|------|-----|
| arvid-web | static | https://arvid-web.onrender.com |
| arvid-api | web | https://arvid-api.onrender.com |

Push to `main` triggers auto-deploy. See [.cursor/rules/deploy.mdc](.cursor/rules/deploy.mdc) for deploy rules.
