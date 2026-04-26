# Niche Finder

Niche Finder is a research-first app opportunity engine.

You enter a community niche, the app runs a real multi-source pipeline (Reddit, App Store, Web), then streams a structured 7-section opportunity brief that can be saved and shared at a unique URL.

## Why It Exists

Most idea tools hallucinate. Niche Finder is built to ground outputs in live signals first, then synthesize actionable insight.

- Real source collection before LLM synthesis
- Structured, typed output for every section
- Shareable brief links via KV persistence
- Instant demo path for evaluator-friendly onboarding

## Product Flow

1. Enter niche and optional founder context
2. Run pipeline with live step statuses
3. Stream sections as synthesis completes
4. Save brief and open shareable route

Pipeline order:

- Step 1: Reddit signals
- Step 2: App Store signals
- Step 3: Web signals (Serper/Tavily with fallback)
- Step 4: AI synthesis (streamed)

## Tech Stack

- Next.js (App Router), React, TypeScript
- Zustand for client state
- Zod for schema validation
- OpenAI for section synthesis
- Vercel KV (Upstash-compatible env fallback) for persistence
- Vitest + Testing Library for tests

## Abuse Protection & Reliability

The API layer includes:

- Route-level rate limiting for expensive endpoints
- Request payload size limits before parsing
- Typed success/partial/failed responses
- Graceful fallback behavior for partial upstream failures

## API Routes

- POST /api/research/reddit
- POST /api/research/appstore
- POST /api/research/web
- POST /api/synthesize
- POST /api/brief/save
- GET /api/brief/[id]

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Create env file:

```bash
cp .env.local.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Required Environment Variables

For full pipeline + persistence:

- OPENAI_API_KEY
- SERPER_API_KEY
- TAVILY_API_KEY
- KV_REST_API_URL
- KV_REST_API_TOKEN

Supported KV fallback env names:

- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

## Scripts

```bash
npm run dev        # local development
npm run lint       # eslint checks
npm run test       # vitest suite
npm run build      # production build
npm run start      # serve built app
```

## Demo Mode

The example pill for competitive Rubik's cube solvers loads an instant pre-generated brief.
It bypasses upstream research APIs and is useful for no-key demos and evaluator walkthroughs.

## Deployment (Vercel)

1. Set all required environment variables
2. Ensure CI passes lint, test, and build
3. Deploy

Main branch includes a CI workflow that runs:

- npm run lint
- npm run test
- npm run build
