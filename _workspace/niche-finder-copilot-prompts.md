# Niche App Opportunity Finder — Copilot Build Prompts

Five sequential prompts. Execute them in order. Each prompt builds on the last. Do not skip ahead — each step has outputs that the next step depends on.

A master plan document exists that describes the full application in detail: architecture, API routes, all seven output sections, data schema, state management, error handling, and the complete UI design specification. These prompts reference that master plan. When a prompt says "per the master plan," it means follow the specification exactly as written there.

---

## Prompt 1 — Project Foundation

```
You are building a Next.js application called "Niche Finder" — a community opportunity brief generator.
Read the full master plan before writing any code. Here it is: [PASTE MASTER PLAN]

In this first step, set up everything that the rest of the application will build on.

Do the following:

1. Initialize a Next.js project with TypeScript and App Router in the current folder (do not create a nested project directory). Set up Tailwind CSS. Install Framer Motion, Zustand, Zod, and nanoid. Install the Vercel KV client.

2. Create the complete TypeScript type definitions for the entire brief object — every field for all seven output sections, the grounded data payload, pipeline state, and settings state. These types live in /types/brief.ts. Be thorough — every field in the master plan's data schema section must be typed here. Use Zod schemas alongside the TypeScript types so the API routes can validate LLM output.

3. Set up the Zustand store with three slices: pipeline state (step statuses, data snippets, streaming progress per section), brief state (the assembling brief object), and settings state (OpenAI API key, in-memory only).

4. Implement the full design system in globals.css: the complete color token system (dark mode default, light mode toggle), typography tokens, spacing tokens, and the base stylesheet resets. Follow the UI design specification in the master plan exactly — warm dark surfaces, one teal/jade accent, monospace data values, off-white primary text. Define CSS variables for all tokens.

5. Create the root layout with: the correct font imports (display, mono, body — three fonts as described in the UI spec), the dark/light mode toggle wired to a data-theme attribute on the html element, and the basic page shell.

6. Create a .env.local.example file listing all required environment variables: OPENAI_API_KEY, SERPER_API_KEY, TAVILY_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN.

When done, the project should compile cleanly with no TypeScript errors. There is no visible UI yet beyond the root layout. The types, store, and design tokens are the deliverable of this step.
```

---

## Prompt 2 — API Routes (The Research Pipeline)

```
The project foundation from Step 1 is complete. Types, Zod schemas, Zustand store, and design system are all in place.

Now build all six API routes that power the research pipeline. These routes are the core of the application — they are what makes this tool different from a chatbot. All external API calls happen server-side. Server-managed API keys are never exposed to the client. The user-provided OpenAI API key is held in client memory only and sent only to /api/synthesize via request headers.

Build these routes in order:

1. /api/research/reddit
   Accepts: { niche: string }
   Behavior: Makes two Reddit public JSON calls — one to search for the closest matching subreddit (reddit.com/search.json?q={niche}&type=sr&limit=3), one to fetch about data for the best match (reddit.com/r/{name}/about.json), and one to fetch top posts from the past year (reddit.com/r/{name}/top.json?t=year&limit=25). No authentication required. Returns a typed RedditSignal object: subreddit name, subscriber count, top post titles with scores, most common flairs. If no subreddit is found, returns status: "not_found" with a fallbackNote.

2. /api/research/appstore
   Accepts: { niche: string }
   Behavior: Calls the iTunes Search API (itunes.apple.com/search) with the niche as the term, entity=software, limit=5. Returns top 5 results as typed AppResult objects: app name, rating, review count, last-updated date, seller name, description. Sorted by relevance. If no results, returns status: "not_found".

3. /api/research/web
   Accepts: { niche: string }
   Behavior: Uses both Serper.dev and Tavily as web search providers with fallback behavior. Use a deterministic primary-provider rule: hash the niche string and select Serper for even hash parity and Tavily for odd hash parity. Run two searches: one for existing tools ("{niche} app tool software"), one for community discussions ("is there an app for {niche} forum reddit"). If the primary provider fails, times out, or returns weak/empty results, retry via the secondary provider. Return top 10 combined results as typed WebSignal objects: title, url, snippet. Deduplicate by domain. Include metadata in the typed response for providerUsed, fallbackProviderUsed (if any), and status.

4. /api/synthesize
   Accepts: { niche: string, groundedData: { reddit, appstore, web }, founderContext?: string }
   Behavior: A streaming endpoint. Do not author a new system prompt here. Use the exact system prompt and buildUserPrompt wiring from synthesize-prompt.md (file 3) verbatim. Uses OpenAI streaming with the API key from the request header (passed from client settings state, never stored server-side). Streams the response back to the client. Each section arrives as a complete parseable JSON chunk.

5. /api/brief/save
   Accepts: a complete NicheBrief object
   Behavior: Generates a nanoid, saves the brief to Vercel KV with the ID as the key, returns the ID.

6. /api/brief/[id]
   Accepts: ID as a URL param
   Behavior: Fetches the brief from Vercel KV by ID. Returns the full NicheBrief object or a 404.

Each route must return typed responses and handle errors gracefully per the error handling specification in the master plan. Every route returns a status field.
```

---

## Prompt 3 — Home Page and Pipeline Runner

```
API routes are complete. Now build the two interactive UI stages: the home page input screen and the pipeline runner.

1. Home Page (/)
   Build the input stage exactly per the UI design specification in the master plan.
   - Large centered niche input field (~65% viewport width desktop, full-width mobile). Subtle animated border on focus that transitions to the accent color. Placeholder text: "e.g. competitive Rubik's cube solvers"
   - Three example pills below the input: "competitive Rubik's cube solvers", "Indian kirana store owners", "DnD dungeon masters". Ghost-style buttons.
   - Strategic demo path: clicking "competitive Rubik's cube solvers" should load a hardcoded pre-generated brief instantly (no external API calls, no pipeline wait). This is a first-class demo fallback for evaluators.
   - Clicking the other two example pills should fill the input field normally.
   - Optional secondary field below the pills, visually smaller and clearly secondary: "Any personal connection to this community?" with placeholder "e.g. I've been speedcubing for 6 years"
   - A collapsible settings panel (gear icon, top right) that reveals the OpenAI API key input. Key is stored only in Zustand settings state, never in localStorage or any persistent storage.
   - A full-width primary CTA button: "Generate Brief". Disabled state when input is empty. Active state uses the accent color.
   - The home page should feel minimal and confident. No hero copy, no marketing text, no decorative elements.

2. Pipeline Runner
   When the user submits, the home page transitions to the pipeline runner view. This takes over the full screen. Build it as follows:
   - Dark background (same as page background). The four steps render as a vertical stack left-aligned with a content-width container.
   - Each step has: a left-side status indicator (muted dot = pending, pulsing animated dot = active, scale-in checkmark = complete), a step label in the accent color while active and muted while pending, and a data snippet line that fades up when the step completes.
   - Steps 1-3 (Reddit, App Store, Web) run in parallel via Promise.all. Their status indicators should reflect actual completion — they may complete in any order.
   - The Web step should expose which provider served the request (Serper or Tavily), and whether fallback was needed.
   - Step 4 (Synthesis) begins only after all three complete. As it runs, the seven brief sections begin rendering below the pipeline log with skeleton loaders. Each section transitions from skeleton to populated content as its JSON chunk arrives from the stream.
   - The visual transition from pipeline runner into the full brief should feel continuous — the pipeline log slides up and pins to a small "research complete" indicator at the top, and the brief fills the page below it.
   - All animations use Framer Motion. Respect prefers-reduced-motion.

Wire the full data flow for normal generation: home page submits → Zustand pipeline state updates → three parallel API calls fire → results merge → synthesize streaming call fires → sections populate in brief state one by one → on completion, /api/brief/save is called and the URL updates to /brief/[id].

Wire the full data flow for instant demo generation: click Rubik's example pill → load hardcoded brief object into brief state immediately → save via /api/brief/save (or route to a fixed demo brief ID if preferred) → URL updates to /brief/[id] without upstream research calls.

If demo save to KV fails, render the demo brief immediately in-app with a local unsaved mode banner ("Demo brief loaded locally — share link unavailable") so the evaluator still sees full output.
```

---

## Prompt 4 — The Brief Page and All Seven Output Sections

```
The pipeline runner is complete and brief state populates correctly. Now build the brief page and all seven output section components.

Brief page route: /brief/[id]
This is a server-rendered page. It fetches the brief from /api/brief/[id] and renders the full brief. It must work without JavaScript on the viewer's side — anyone with the link sees the full brief. If the ID is not found, render a clean 404 state.

Build each of the seven section components per the master plan's output section specifications. Each component accepts its typed section data as a prop and has a defined skeleton state (shimmer animation matching the section layout) used during streaming.

Section components and their layout rules:

CommunityPulse.tsx
Renders as a data grid: stat blocks for member count, activity level (High/Medium/Low badge), and top themes as tags. All numbers in monospace font. Labels small and muted. Feels like a signal dashboard.

PainPoints.tsx
Three cards in a vertical stack. Each card: signal strength badge (colored dot + text) top-right, pain statement as the headline in primary text, evidence line below in secondary smaller text. Cards have subtle border, dark surface background.

CompetitiveTeardown.tsx
Compact list layout. Each competitor: app name + star rating (real number from grounded data) + last updated date on the left, weakness tag (pill badge) + "why it fails" one-liner on the right. If no apps were found, render a positive-signal card: "No dedicated apps found in this niche" with a green tint and the note that this is a signal, not a gap.

MotherInsight.tsx
Full-width section, no card or border. The insight text set significantly larger than everything else on the page using the display font. Centered, generous padding above and below. This is the visual anchor of the brief. No label, no supporting text — the statement stands alone.

MVPIdea.tsx
Single card with distinct internal zones: product name at top in display font at a larger size, one-liner description below, three core features as a clean numbered list, monetization hypothesis as a highlighted callout block within the card using a subtle accent-tinted surface.

HypothesisRoadmap.tsx
Two experiment cards side by side on desktop, stacked on mobile. Each card labeled "Experiment 1" / "Experiment 2" in small muted caps. Four internal rows per card: assumption, how to run it, yes signal (green tint), no signal (muted).

BuildSignal.tsx
The final section and most visually distinct. Large verdict circle (green / yellow / red with label) centered at top — it scales in gently with Framer Motion when it appears. Three data-point lines below in a tight list. If a founder edge note exists, render it as a separate callout below the data points with a subtle border.

After all seven components are built, assemble the brief page: section order as listed above, generous vertical spacing between sections, subtle dividers, and a sticky bottom bar that appears after generation with "Brief saved · Share link" and a one-click copy button for the URL. A top-right "Export" button triggers the browser print dialog. The brief page should have print CSS that: sets white background, removes nav chrome and the sticky bar, and renders all seven sections cleanly.
```

---

## Prompt 5 — Error States, Edge Cases, and Tests

```
The full application is built. This final step hardens it: proper error handling throughout, all edge case states rendered, and a test suite covering the critical paths.

Error handling pass:
- Each API route already returns a status field. Now make sure every section component has a defined error state: a muted card with the specific failure noted (e.g., "Reddit data unavailable — synthesis used web signals only") and a retry button that re-runs only that upstream API call and re-synthesizes only the affected section.
- The synthesis prompt must be updated to explicitly note which upstream sources were unavailable and instruct the LLM to say so in affected sections rather than hallucinating substitutes.
- The "no results" state for Competitive Teardown is not an error — ensure it renders as the positive signal card described in the master plan, not as an error state.
- If the streaming connection drops mid-synthesis, the sections that already populated should remain. The incomplete section shows a retry button for that section only.
- If the OpenAI API key is missing or invalid, catch this before the pipeline starts and show an inline error on the settings panel — do not let the pipeline runner start.

Edge cases to handle:
- Niche input that is too short (under 3 words) — inline validation message before submission
- Niche input that returns no Reddit results AND no App Store results AND no web results (from both Serper and Tavily) — render a "Thin signal" warning at the top of the brief noting that grounded data was limited and the brief is more speculative than usual
- Very slow API responses — each of the first three pipeline steps has a 10-second timeout; if exceeded, it returns a partial result with a note rather than blocking Step 4
- Brief ID not found on the /brief/[id] page — clean 404 with a link back to home and a message: "This brief may have expired or the link may be incorrect"

Test suite:
Write tests for the following. Use whatever testing framework fits the project.

API route unit tests:
- Reddit route: mock the Reddit JSON responses, assert the returned RedditSignal shape is correct, assert that a missing subreddit returns status "not_found" with a fallbackNote
- App Store route: mock the iTunes API response, assert the top 5 results are returned and shaped correctly, assert that an empty result returns status "not_found"
- Brief save/fetch: mock Vercel KV, assert that save generates an ID and fetch returns the correct object by ID, assert that a missing ID returns a 404

Zod schema tests:
- Assert that a valid complete NicheBrief object passes all Zod schemas
- Assert that a brief with a missing required field (e.g., no motherInsight) fails validation with a descriptive error
- Assert that a brief with an invalid BuildSignal verdict (not green/yellow/red) fails validation

Pipeline integration test:
- Mock all three research API routes to return fixture data
- Mock the synthesize route to return a complete valid brief JSON
- Assert that after the pipeline completes, the Zustand brief state contains a fully populated NicheBrief object with all seven sections

Component smoke tests:
- Render each of the seven section components with fixture data and assert they mount without errors
- Render each section component with no data (skeleton state) and assert the skeleton renders correctly

After all tests pass, do a final pass: check that no API keys appear anywhere in client-side code, that the OpenAI key only travels in request headers to /api/synthesize, and that SERPER_API_KEY, TAVILY_API_KEY, and Vercel KV tokens are only referenced in server-side route files.
```

