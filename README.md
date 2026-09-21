# anakata-engine

Public booking engine for Anakata. Nuxt 4 with **SSR** on port **3000**. Extends the `anakata-ui` layer and applies engine-only visual overrides from the booking-engine prototype.

| | |
|---|---|
| Port | **3000** |
| Render | SSR |
| Layer | `extends: ['../anakata-ui']` (`v0.6.4`) |
| API | `NUXT_PUBLIC_API_BASE` (default `http://localhost:8000`) |

The API must already allow this origin. CORS is configured on the API via `FRONTEND_ENGINE_URL=http://localhost:3000`.

## Setup

```bash
pnpm install
cp .env.example .env
```

`.env`:

```
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

## Run

From the Cursor workspace, use **Anakata: start everything** — it starts the API and `pnpm dev --port 3000` for this app.

Or locally:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Placeholder routes (flow built in Sprint 8): `/`, `/itineraries`, `/itineraries/[slug]`, `/book/cabins`, `/book/details`, `/book/confirmation`, `/charter`.

## Quality

```bash
pnpm lint
pnpm typecheck
pnpm build
```
