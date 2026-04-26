# Niche App Opportunity Finder — Master Plan

A web application that takes any niche community as a plain-text input, runs a real multi-source research pipeline, and outputs a fully structured **Community Opportunity Brief** — seven analytical sections grounded in live data, shareable via a unique URL.

The brief should feel like the output of a 2-hour focused research session by a skilled indie hacker: opinionated, specific, data-backed, and immediately actionable.

---

## Purpose & Philosophy

This is not a chatbot. It is not a form that calls GPT and dumps text. It is a **systematic research pipeline** that collects real signals first, then synthesizes intelligence on top of them. Every number in the output must trace back to a real API call. The LLM's job is structure, language, and insight — not data invention.

The output is designed to be shared. Every brief gets a unique URL. A founder or investor should be able to open the link without any account, read the full brief, and immediately understand the opportunity.

---

## Core User Flow

1. User lands on the home page — clean, minimal, one input field prominent
2. User types a niche community description in natural language
3. User optionally fills a second field: personal connection to this community
4. User clicks "Generate Brief" (or selects the instant demo brief from the Rubik's example pill)
5. A full-screen pipeline runner takes over — four steps execute, each showing live status and real data snippets as they come in
6. The complete brief renders section by section as the LLM streams each output
7. The brief is assigned a unique ID and a shareable URL is generated
8. User can copy the URL or use the "Export Brief" action

Instant demo path:
- The "competitive Rubik's cube solvers" example pill can load a hardcoded pre-generated brief immediately.
- This path bypasses upstream research APIs so evaluators can see full output without keys or waiting.
- The resulting brief should still be saved and shareable via `/brief/[id]`.
- If KV is unavailable, the app should still render the demo brief in local unsaved mode with a clear "share link unavailable" notice.

---

## Application Architecture

### Pages

**Home (`/`)**
The input stage. Two fields, three example niche pills, and a single CTA button.

**Brief (`/brief/[id]`)**
The shareable output page. Renders the full brief by fetching from persistent storage by ID. Works without a session — anyone with the link can view it.

### API Routes (Server-Side)

All external API calls happen server-side. Server-managed API keys are never exposed to the client. OpenAI access is handled server-side via `OPENAI_API_KEY`.

**`/api/research/reddit`**
Accepts a niche string. Attempts to identify the closest matching subreddit(s). Calls Reddit's public JSON endpoints — no authentication required. Returns: subreddit name, subscriber count, top post titles with upvote counts from the past year, and the most common post flairs. If no subreddit is found, returns a structured empty result with a note.

**`/api/research/appstore`**
Accepts a niche string. Calls the iTunes Search API. Returns top 5 matching apps with: app name, current rating, total review count, last-updated date, seller name, short description. Sorted by relevance.

**`/api/research/web`**
Accepts a niche string. Uses Serper.dev and Tavily as interchangeable web research providers via server-side keys. For each request, pick a deterministic primary provider using niche-hash parity (even = Serper, odd = Tavily), run searches for: existing tools, forum discussions, and "is there an app for X" threads, and fall back to the secondary provider when needed (error, timeout, or insufficient results). Returns top 10 results with title, URL, and description snippet, plus provider metadata.

**`/api/synthesize`**
Streaming endpoint. Accepts the full grounded research payload from all three sources plus the niche string and optional founder context. Sends a structured prompt to OpenAI. Returns a streaming JSON response — each of the seven output sections streams as the LLM completes them. Validates each completed JSON line chunk against the matching section schema before forwarding to the client; malformed chunks trigger a retry path/fallback for that section.

**`/api/brief/save`**
Accepts a completed brief object. Generates a nanoid. Saves to Vercel KV. Returns the ID.

**`/api/brief/[id]`**
Fetches a saved brief from Vercel KV by ID. Used by the `/brief/[id]` page.

---

## The Research Pipeline — Execution Model

Steps 1, 2, and 3 run in parallel using `Promise.all`. Step 4 only begins after all three complete and their results are merged into a single context payload.

```
Step 1: Reddit Signals       ← live subreddit data
Step 2: App Store Signals    ← live iTunes data
Step 3: Web Signals          ← live Serper/Tavily results (with fallback)
         ↓ (all complete)
Step 4: AI Synthesis         ← streams the 7-section brief
```

The pipeline runner UI shows each of the first three steps completing independently with a real data snippet visible (e.g., "r/Cubers · 287,493 members · scanning top posts..."). Step 4 shows the brief sections appearing one by one as they stream.

---

## The Seven Output Sections — Full Specification

### 1. Community Pulse
**Source:** Grounded (Reddit + Web signals)

Displays as a data dashboard, not prose. Contains:
- Primary community platform(s) found with real member/subscriber counts
- Top 3 recurring themes from actual post titles (synthesized from real titles, not invented)
- Community activity signal: High / Medium / Low based on post frequency
- A one-line "community character" descriptor synthesized by the LLM

### 2. Pain Points
**Source:** Synthesized from real Reddit post titles and web forum signals

Exactly three pain points. Each contains:
- A specific, named pain (not generic — must reference actual community behavior or vocabulary)
- Signal strength: High / Medium / Emerging (derived from post frequency patterns in the grounded data)
- One supporting evidence line: a paraphrased real post title or forum quote

### 3. Competitive Teardown
**Source:** Grounded (App Store) + Synthesized

Covers 2-3 real apps returned by the iTunes API. Each entry contains:
- App name, rating (real number), last updated (real date), review count (real number)
- A "why it fails this community" verdict — one sharp sentence from the LLM, specific to the niche
- An "incumbent weakness" tag: e.g., Abandoned / Desktop-only / Generic / No community features

If no relevant apps are found, this section surfaces web-based tools found via the web provider layer (Serper/Tavily) and applies the same teardown format.

### 4. The Mother Insight
**Source:** Synthesized

A single bold statement — the non-obvious reframing of the opportunity that makes someone say "oh, that's the real thing." This is not a summary of pain points. It is a synthesis that reframes the community at a level deeper than "they have bad tools."

Example character (not a template): *"Competitive speedcubers are performance athletes who have built a world-class training culture with zero sports-science-grade infrastructure."*

Displayed as a large pull-quote. No supporting text — the insight stands alone.

### 5. MVP Idea
**Source:** Synthesized

Contains:
- A product name (punchy, specific to the niche)
- One-sentence description: what it does, for whom, and how it differs
- Exactly 3 core features — not a roadmap, just the three things that solve Pain Point #1
- Monetization hypothesis: one specific model with a price point and a one-line rationale tied to community spending behavior observed in the research
- Platform recommendation: mobile-first / web-first / desktop — with one-line reasoning

### 6. Hypothesis Roadmap
**Source:** Synthesized

Exactly two validation experiments. Each contains:
- The assumption being tested
- How to run it in 48 hours — specific: names the actual subreddit to post in, the type of post to make, or the type of DM to send
- What a "yes signal" looks like: a specific measurable outcome (e.g., "15+ DMs asking for beta access within 48 hours")
- What a "no signal" looks like and what it means for the idea

### 7. Build Signal
**Source:** Synthesized (with grounded data points)

A verdict: Green / Yellow / Red — with three specific supporting data points drawn from the grounded research. Not opinions — each data point references a real number or finding from the pipeline.

If the user provided a personal connection note, this section includes a one-line "founder edge" assessment: whether their background gives them a signal advantage in this niche.

---

## Data Schema — The Brief Object

The brief is a single typed object stored in Vercel KV and rendered on the brief page. It contains:

- Unique ID (nanoid)
- Niche string as entered
- Timestamp
- Raw grounded data payload (Reddit result, App Store results, Web results) — stored alongside the brief for transparency
- All seven output sections as structured typed objects
- Optional founder context string
- Optional generation metadata (for transparency): `webProviderUsed`, `webFallbackProviderUsed` (if any), and `isDemoBrief`

All seven output sections are validated against the schema before saving. If the LLM returns malformed JSON for any section, that section retries once before rendering a fallback state.

---

## Sharing & Persistence

Every generated brief is saved automatically on completion. The brief URL (`/brief/abc123`) is shown after generation with a one-click copy button.

The brief page is fully server-rendered — it works without JavaScript for the viewer. Anyone with the link sees the complete brief immediately. No login, no session required.

Briefs do not expire. Storage is Vercel KV.

---

## State Management

Application state has three zones:

**Pipeline state** — tracks which of the four steps are pending / running / complete, stores the raw data snippet from each step for display in the pipeline runner UI, and tracks the streaming progress of each of the seven sections.

**Brief state** — the assembled brief object as it fills in during streaming. Each section transitions from skeleton to populated as the stream delivers it.

**Settings state** — UI preferences only (for example, dark/light theme).

---

## Error Handling Specification

Each API route returns a typed result object with a `status` field (`success` / `partial` / `failed`) and an optional `fallbackNote` string. The synthesis step is aware of which upstream steps succeeded and which failed, and its prompt instructs it to note any missing data rather than hallucinating substitutes.

The UI has defined states for:
- Subreddit not found → "Community appears to be on Discord/Facebook — web signals used only"
- No App Store results → "No dedicated apps found — web tools surfaced instead"
- Primary web provider unavailable → auto-fallback to secondary provider, with a subtle note in pipeline logs
- Both web providers unavailable → continue as partial with a fallback note in grounded data
- Synthesis stream interrupted → Section shows retry button, rest of brief still renders
- Full pipeline failure → Inline error with specific step identified

---

---

# UI Design Specification

## Design Identity

**Name:** Niche Finder
**Tone:** Intelligence briefing. Research terminal. Confident and minimal.
**Reference feel:** The visual seriousness of a Bloomberg terminal crossed with the clarity of a Linear issue page. Dense with meaning, never cluttered with decoration.

This is a tool used by people who think carefully about markets. The UI should feel like it was built by someone who has shipped real products, not designed by committee. Every element earns its place.

---

## Color System

**Base palette:** Near-black backgrounds. Warm dark surfaces (not cold gray — slight warmth in the dark values). Cream/off-white primary text. One primary accent: a sharp electric teal or vivid jade — used sparingly and only for interactive elements, active states, and signal indicators.

**Surface hierarchy (dark mode is default):**
- Page background: very dark warm near-black
- Card surface: slightly lighter, still dark
- Elevated card / active state: another step lighter
- Dividers: subtle, barely visible

**Accent usage discipline:**
- Accent color appears on: the primary CTA button, active pipeline steps, signal strength badges (High), the Build Signal green verdict, hyperlinks
- Accent never appears on: backgrounds, card fills, decorative elements
- All other UI chrome is monochromatic — warm grays and off-whites

**Text hierarchy:**
- Primary text: bright off-white (not pure white — slightly warm)
- Secondary text: medium gray
- Tertiary / metadata: dim gray
- The Mother Insight pull-quote: full primary accent color or slightly brightened off-white with increased size

**Light mode:** Supported via toggle. Inverts to warm off-white backgrounds with the same teal accent. The brief page defaults to light mode for print/share friendliness.

---

## Typography

**Two fonts only:**
- Display font: A geometric or humanist sans-serif with strong personality at large sizes — used for the app name, the Mother Insight pull-quote, and section headers
- Mono font: Used for all data values — subscriber counts, ratings, dates, signal badges, the pipeline step log — reinforcing the "research terminal" feel
- Body font: A clean neutral sans-serif for all descriptive text and prose sections

The Mother Insight is set significantly larger than everything else on the brief — it should be the visual anchor of the page.

---

## Layout Principles

**Home page:** Centered single-column. The niche input field is large — 60-70% of viewport width on desktop, full-width on mobile. It has a subtle animated border on focus. Below it: the optional field, smaller and clearly secondary. The three example pills are below that, each a ghost-style clickable tag that fills the input on click. The CTA button is full-width below.

One example pill ("competitive Rubik's cube solvers") should support an instant-load demo brief behavior to provide a no-key showcase mode.

**Pipeline runner:** Takes over the full screen. Dark background. The four steps stack vertically with a left-side status indicator: a pulsing dot for active, a checkmark for complete, a muted dot for pending. Each completed step reveals a one-line data snippet in monospace. Feels like a terminal that's doing real work. Step 4 (synthesis) is different — instead of a single line, the brief sections begin appearing below the pipeline log as they stream in, creating a smooth transition into the brief.

**Brief page:** Single-column, content-width (~720px max for prose, full-width for the Community Pulse data dashboard). Sections are separated by generous vertical space and subtle dividers. No section headers use icons or decorative elements — typography weight and size alone creates hierarchy.

The section order on the brief page matches the output order: Community Pulse → Pain Points → Competitive Teardown → Mother Insight → MVP Idea → Hypothesis Roadmap → Build Signal.

**Community Pulse section** renders as a data grid: three or four stat blocks in a row (member count, activity level, top themes as tags). Monospace numbers, small labels.

**Pain Points** render as three cards in a vertical stack. Each card has the signal strength badge top-right (colored dot + text), the pain statement as the headline, and the evidence line below in smaller secondary text.

**Competitive Teardown** renders as a compact table-like list: app name + rating stars + last updated on the left, weakness tag + "why it fails" verdict on the right.

**Mother Insight** gets its own full-width section break — large text, centered, generous padding above and below. No card, no border. Just the statement.

**MVP Idea** renders as a single card with distinct internal zones: product name at top (display font, larger), one-liner below, then three feature lines as a clean numbered list, then the monetization hypothesis as a highlighted callout block within the card.

**Hypothesis Roadmap** renders as two experiment cards side by side on desktop, stacked on mobile. Each card is clearly labeled Experiment 1 / Experiment 2, with internal rows for: assumption, how to run it, yes signal, no signal.

**Build Signal** is the final section and the most visually distinct. A large verdict badge (Green / Yellow / Red circle with label) centered at top, then three data-point lines below it in a tight list. If a founder edge note exists, it appears as a separate callout below the data points.

---

## Motion & Animation

**Pipeline runner:** Each step's status dot animates from pending → active (gentle pulse) → complete (scale-in checkmark). The data snippet for each completed step fades up from below. Smooth, not flashy.

**Brief sections streaming in:** Each section fades and slides up from 8-10px below its final position as it arrives. Not simultaneous — there is a slight stagger as each section completes streaming. Skeleton loaders (shimmer bars) hold the layout while sections are pending.

**Home page input:** On focus, the input field's border animates to the accent color. On hover of example pills, they shift background subtly.

**Build Signal verdict:** The colored circle scales up gently when it appears — the one theatrical moment in the brief, earned by being the conclusion.

**Reduced motion:** All animations collapse to instant state changes for users who prefer reduced motion.

---

## Responsive Behavior

- Mobile-first layout: all sections single-column
- The Hypothesis Roadmap cards (side-by-side on desktop) stack vertically on mobile
- The Community Pulse stat grid wraps to two columns on mobile
- The niche input is always full-width on mobile
- The pipeline runner is the same on all screen sizes
- Touch targets are all at minimum 44px

---

## Export & Share UI

After the brief generates:
- The URL bar updates to `/brief/[id]`
- A sticky bottom bar appears (dismissible) with: "Brief saved · Share link" and a copy button
- A subtle "Export" option in the top right: triggers browser print dialog (brief page is print-styled — light background, no nav chrome)

---

## Empty & Error States

Each of the seven sections has a defined skeleton state (animated shimmer bars matching the section's approximate layout) and a defined error state (muted card with the specific upstream failure noted and a retry option for that section only).

The "no results" state for Competitive Teardown is not treated as an error — it is surfaced as a positive signal: "No dedicated apps found in this niche" rendered with a green tint.

