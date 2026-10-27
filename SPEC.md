# AI Mystery Room --- Product & Engineering Specification

**Document:** `SPEC.md`\
**Project:** AI Mystery Room\
**Status:** Implementation specification\
**Deadline:** 2 November 2026, 11:59 PM (local project deadline supplied
by the project brief)\
**Primary goal:** Deliver a polished, responsive, secure, deployed AI
detective game with a complete mystery-solving flow.

------------------------------------------------------------------------

## 1. Instructions to the coding assistant

Implement this specification as a working full-stack application, not
just a design mockup or a collection of placeholder files.

1.  Inspect the existing repository before changing anything. Preserve
    working code and explain any significant structural changes.
2.  Treat this document as the source of truth. If a detail is
    unspecified, choose the simplest secure, maintainable solution and
    document the decision.
3.  Build in small, testable stages. After each stage, run the available
    checks, fix errors, and report what works and what remains.
4.  Do not claim a feature is complete unless it has been implemented
    and tested.
5.  Do not hardcode fake success states, fake API results, fake database
    persistence, or a fake Gemini response in production code. A clearly
    labelled development fixture may be used only for local testing if
    Gemini credentials are unavailable.
6.  Implement the complete frontend, backend, MongoDB persistence,
    Gemini integration, validation, error handling, tests, and
    deployment documentation.
7.  Prioritize the full required gameplay and security over optional
    features. Do not add authentication, multiplayer, subscriptions,
    payments, leaderboards, or other scope-expanding features unless
    explicitly requested.
8.  Do not expose API keys, the culprit ID, the private solution,
    private reasoning, or secret answer-bearing fields to the browser
    before the case is completed.
9.  Use accessible, responsive, production-quality UI. Do not leave TODO
    buttons, dead links, placeholder pages, or nonfunctional controls.
10. At the end, provide: setup commands, environment variable
    instructions, test commands, deployment instructions, known
    limitations, and a checklist of what was actually verified.

## 2. Product overview

AI Mystery Room is an AI-powered, single-player detective game. A player
creates a mystery by entering a premise and selecting a difficulty.
Gemini generates a structured case containing a story, suspects, clues,
and hints. The player studies the evidence, asks for hints when needed,
accuses one suspect, and receives a verdict, explanation, and score.

### 2.1 Problem statement

Many AI story experiences are passive: the user reads generated text but
has little meaningful interaction. AI Mystery Room turns generated
mystery fiction into a structured investigation with discoverable
evidence, limited hints, a meaningful accusation, and transparent
scoring.

### 2.2 Target users

-   People who enjoy detective stories, puzzles, escape rooms, and
    interactive fiction.
-   Students and casual players who want a short, replayable
    mystery-solving experience.
-   Users on desktop, laptop, tablet, and mobile browsers.

### 2.3 Product principles

-   **Atmosphere:** Feel like a modern detective's case room, not a
    generic admin dashboard.
-   **Fairness:** The solution must be supported by discoverable clues
    and be logically distinguishable from innocent suspects.
-   **Clarity:** Players should understand what to do, what they have
    discovered, and how scoring works.
-   **Security:** The server owns the answer and the score.
-   **Reliability:** Handle invalid AI output, network failures, missing
    cases, duplicate actions, and deployment configuration errors
    gracefully.
-   **Replayability:** A player can start another mystery after
    finishing one.

## 3. Required technology stack

### Frontend

-   React
-   Vite
-   Tailwind CSS
-   React Router
-   Axios
-   Lucide React icons (or a consistent icon library)
-   JavaScript is acceptable; use TypeScript only if the repository is
    already configured for it or the implementation can remain
    straightforward.

### Backend

-   Node.js
-   Express
-   MongoDB
-   Mongoose
-   `@google/genai` official Google GenAI SDK
-   Zod for request and AI-output validation
-   `dotenv`
-   `cors`
-   `helmet` for basic HTTP security headers
-   `express-rate-limit` for basic rate limiting where appropriate

### Testing

-   Vitest and React Testing Library for frontend tests where practical
-   Node's built-in test runner, Vitest, or Jest for backend tests
-   Supertest for Express API tests where practical

Use mutually compatible, currently supported package versions. Do not
blindly copy obsolete configuration. Check the installed package
versions and use their current APIs.

## 4. Scope and priorities

### 4.1 Must-have (release blockers)

-   Home/landing page with a clear start action.
-   Create Mystery page with premise input and Easy, Medium, Hard
    difficulty.
-   Gemini-generated structured mysteries.
-   Exactly the required number of suspects, clues, and hints for each
    difficulty.
-   Investigation Room with suspect dossiers, clues, hint panel, and
    progress.
-   Discover clue action with no duplicate points.
-   Limited hint usage.
-   Accusation flow.
-   Backend-only verdict and score calculation.
-   Results page showing verdict, culprit, explanation, and score
    breakdown.
-   MongoDB persistence of cases and progress.
-   Secure API responses that never reveal the solution before
    accusation.
-   Input validation, error states, loading states, and
    mobile-responsive UI.
-   Tests for core rules and security.
-   Deployment configuration and documentation.
-   GitHub-ready source code and a production smoke-test checklist.

### 4.2 Optional only after all must-haves work

-   Sound effects or motion effects (must respect reduced-motion
    settings).
-   Additional story themes.
-   Printable case summary.
-   Local case history.
-   Small achievements that do not affect core scoring.

Do not implement accounts or multiplayer in the MVP.

## 5. User journey and application routes

### 5.1 Routes

-   `/` --- Home
-   `/create` --- Create Mystery
-   `/investigation/:id` --- Investigation Room
-   `/results/:id` --- Results

Unknown routes must show a designed 404 page with a link back home.

### 5.2 Main journey

1.  User opens Home and sees the concept, a brief explanation, and a
    prominent "Start Investigation" CTA.
2.  User navigates to Create Mystery.
3.  User enters a premise (or chooses a clearly labelled sample premise)
    and selects difficulty.
4.  Frontend submits a request to the backend.
5.  Backend validates input, asks Gemini for structured mystery data,
    validates the output, checks basic logical consistency, and stores
    the case.
6.  Backend returns only public case data and the case ID.
7.  User investigates the story, suspect dossiers, and clues.
8.  User discovers clues; progress is persisted.
9.  User requests hints within the difficulty limit; hint use is
    persisted.
10. User selects one suspect and confirms the accusation.
11. Backend evaluates the accusation and calculates the score.
12. Backend marks the case complete and returns the result.
13. Results page displays correct/incorrect verdict, culprit,
    explanation, score breakdown, and "Play Again".
14. "Play Again" navigates to `/create` and clears only the current
    client-side case state.

### 5.3 User/session model

For MVP, no account system is required. Each case is a standalone
single-player session identified by an unguessable MongoDB ObjectId or
another secure identifier. Treat the case ID as a locator, not as
authorization. Rate-limit creation and mutations. Do not claim that
unauthenticated case IDs provide strong privacy. Do not store
unnecessary personal information.

## 6. Visual design system --- essential product requirement

The UI is a major part of the project. It must clearly relate to
detective investigations, case files, evidence, suspects, and mystery
solving. Avoid a generic SaaS dashboard, plain white CRUD forms, random
gradients, excessive glassmorphism, or emoji-only cards.

### 6.1 Art direction

**Concept:** "A modern detective's private investigation room meets a
premium interactive thriller."

Visual references to translate into a coherent interface: - Charcoal/ink
backgrounds with layered surfaces. - Warm amber/brass accents for active
actions, case numbers, and evidence highlights. - Muted ivory text for
readability. - Desaturated slate, olive, burgundy, and muted red used
sparingly for labels and status. - Fine borders, subtle paper grain or
noise (CSS only where lightweight), dossier tabs, evidence labels, case
stamps, and thin connector lines. - Strong typography hierarchy: a
characterful editorial display font for large titles, paired with a
clean sans-serif for controls and body text. Use reliable web fonts only
if network loading is acceptable; provide local/system fallbacks. -
Purposeful icons, consistent line weight, and deliberate spacing. -
Subtle transitions for panels, clue discovery, route changes, and
loading. Respect `prefers-reduced-motion`. - Use custom CSS shapes and
layout for evidence-board effects; do not require a large collection of
stock photos to make the UI feel finished.

### 6.2 Suggested design tokens

Create tokens using CSS variables and Tailwind theme configuration as
appropriate. These are guidance; maintain contrast and consistency.

-   `--color-bg`: `#101113` (main ink background)
-   `--color-surface`: `#191B1F` (main panels)
-   `--color-surface-raised`: `#22252A` (raised cards)
-   `--color-border`: `#34373D` (subtle borders)
-   `--color-text`: `#F3F0E8` (primary text)
-   `--color-muted`: `#A5A6A8` (secondary text)
-   `--color-accent`: `#D7A64A` (amber/brass)
-   `--color-accent-hover`: `#E7B95E`
-   `--color-success`: `#78A88A`
-   `--color-danger`: `#D66A64`
-   `--color-info`: `#8BA9C7`

Avoid using accent colors for every element. Reserve amber for hierarchy
and actions.

### 6.3 Layout and components

Build a consistent component library: - `AppShell` - `Navbar` / compact
mobile navigation - `Button` variants: primary, secondary, ghost,
danger - `PageHeader` - `CaseStamp` / `CaseNumber` - `DifficultyBadge` -
`Card` / `Panel` - `SuspectCard` - `ClueCard` - `HintPanel` -
`ProgressSummary` - `LoadingState` / skeleton - `ErrorState` / retry -
`EmptyState` - `ConfirmDialog` or accessible inline confirmation -
`ScoreBreakdown` - `Footer` - `Toast` or inline status messaging

Use reusable components rather than repeating large blocks of markup.
Use CSS for polish, not unnecessary dependencies.

### 6.4 Page specifications

#### Home `/`

Required: - Header with simple logo/wordmark such as "MYSTERY ROOM" and
navigation. - Hero headline with an investigative tone, e.g. "Every clue
tells a story. Every suspect hides one." - One concise paragraph
explaining that the player investigates AI-generated cases. - Strong
"Start Investigation" button. - A visual case-file/evidence-board motif:
evidence cards, case number, suspect silhouette placeholders, clue
markers, or a timeline. These must be designed UI elements, not fake
interactive controls. - A "How it works" section with three steps: Open
a case, Examine evidence, Make your accusation. - Difficulty preview
cards for Easy, Medium, Hard. - A small footer. - Excellent responsive
layout; avoid a huge empty hero on mobile.

#### Create Mystery `/create`

Required: - Page title and short instruction. - Premise textarea with
sensible character limits (e.g. 20--500 characters); validate on both
client and server. - Optional sample premise buttons that fill the
textarea; label them clearly. - Difficulty cards/radio controls with
suspect, clue, and hint counts. - Generate button with disabled state
while loading. - Loading state with changing, non-misleading
investigation messages; do not pretend the model has completed before
the response arrives. - Error state with retry that does not create
duplicate requests unintentionally. - Accessible validation messages. -
Preserve the user's premise after a recoverable API error.

#### Investigation Room `/investigation/:id`

Required: - Case title, case number, difficulty, and story briefing. -
Progress indicator: discovered clues / total clues. - Suspect dossier
cards with name, description, and public information. - Clue/evidence
section with locked/undiscovered and discovered states. Do not display
hidden clue text until the player discovers it if the design intends
clues to be interactively revealed. - Hint panel showing used hints and
a "Request Hint" action while hints remain. - Persistent visible actions
for clue discovery and "Make an Accusation". - Clear feedback for
discovered clues and used hints. - On refresh, fetch the current public
case and progress from the backend. - On a completed case, redirect to
results or show a safe completed-state link. - The secret culprit ID,
secret solution, and private reasoning must never be in page data, HTML,
JavaScript state, network responses, error messages, logs sent to the
browser, or embedded source maps.

#### Accusation interaction

Can be a modal or a dedicated section within the investigation page.
Must: - List suspects with accessible selection controls. - Show which
suspect is selected. - Require explicit confirmation before
submission. - Explain that the accusation ends the case. - Disable
repeated submissions while the request is in flight. - Show recoverable
errors without losing the selected suspect. - Not expose correctness
until the backend accepts the accusation.

#### Results `/results/:id`

Required: - Clear verdict: "Case Solved" or "Wrong Suspect" / equivalent
clear language. - Culprit's name and a case explanation after
completion. - Score prominently displayed. - Score breakdown: base
points (only if correct), clue points, hint penalties, final score. -
Show discovered clue count and hints used. - Provide "Play Again" and
"Return Home". - If case is incomplete, do not expose the result;
redirect to investigation or show a safe message. - If result retrieval
fails, provide retry and home navigation.

#### 404 and general errors

Design a branded not-found page and a consistent error treatment. Never
display raw stack traces, secrets, database errors, or raw Gemini output
to users.

### 6.5 Accessibility and responsive behavior

-   Semantic HTML and proper heading order.
-   Every input has a visible label.
-   Full keyboard navigation and visible focus rings.
-   Sufficient contrast; do not rely on color alone for status.
-   Buttons have meaningful labels and disabled/loading states.
-   Dialogs manage focus and close accessibly.
-   Images/icons have appropriate accessible treatment.
-   Test at approximately 360px mobile width, tablet width, and desktop
    width.
-   Respect reduced-motion preferences.
-   Avoid horizontal overflow and tiny touch targets.

## 7. Difficulty and scoring rules

### 7.1 Required counts

  Difficulty     Suspects   Clues   Hints   Correct-answer base points
  ------------ ---------- ------- ------- ----------------------------
  Easy                  3       5       2                          100
  Medium                4       7       3                          150
  Hard                  5       9       3                          200

Difficulty must be normalized to one of `easy`, `medium`, or `hard`.
Reject any other value.

### 7.2 Scoring

Let: - `B` = base points for the selected difficulty, awarded only if
the accusation is correct. - `C` = count of unique discovered clue IDs
accepted by the server. - `H` = count of unique hint IDs issued by the
server.

Formula:

`finalScore = max(0, (isCorrect ? B : 0) + (5 * C) - (10 * H))`

The brief specifies a minimum score of zero. Therefore, a wrong
accusation can still receive clue-derived points under the formula, but
receives no base points. Implement the formula literally and show the
breakdown transparently. If the project owner later wants all wrong
accusations to score zero, that is a product-rule change and must be
made consistently in this spec, tests, and UI.

Examples: - Easy, correct, 3 clues, 1 hint: `100 + 15 - 10 = 105`. -
Medium, correct, 4 clues, 2 hints: `150 + 20 - 20 = 150`. - Hard,
correct, 0 clues, 3 hints: `200 + 0 - 30 = 170`. - Wrong accusation, 2
clues, 1 hint: `0 + 10 - 10 = 0`.

Important: The sample scoring in the project brief says "Correct
accusation: \[base score\]" and "Each discovered clue: +5" and "Each
hint used: −10". Apply clue and hint adjustments to the score according
to the formula above, and clamp the final score at zero. Do not award
base points for an incorrect accusation.

### 7.3 Server-side integrity

-   Never accept a score, clue count, hint count, `isCorrect`, or
    culprit ID from the client.
-   Derive counts from persisted server-side progress.
-   Only count each clue/hint once.
-   Use an atomic or otherwise race-safe update strategy for
    progress-changing operations.
-   Make accusation completion idempotent: repeated requests must not
    recalculate or change a completed case.
-   Store the final score and verdict in the database.

## 8. Gemini generation contract

### 8.1 Expected generation output

Use Gemini's structured-output/JSON mode if supported by the selected
model and SDK. Validate all output with Zod regardless. The generation
result should have a schema conceptually like:

``` json
{
  "title": "The Last Train from Ashford",
  "premise": "A valuable ledger vanished during a storm.",
  "story": "A concise, atmospheric briefing that contains no answer reveal.",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Mara Vale",
      "role": "Station manager",
      "description": "Publicly known background.",
      "statement": "What this suspect tells the investigator.",
      "alibi": "The suspect's claimed whereabouts.",
      "publicFacts": ["A fact that is safe to show the player."]
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "title": "A Damp Ticket",
      "description": "Evidence text shown after discovery.",
      "location": "Platform office",
      "significance": "A player-facing observation that does not directly reveal the culprit.",
      "suspectIds": ["suspect_1"]
    }
  ],
  "hints": [
    {
      "id": "hint_1",
      "text": "Compare the timeline with the evidence from the platform."
    }
  ],
  "privateSolution": {
    "culpritId": "suspect_2",
    "motive": "Private solution information.",
    "explanation": "Why the culprit committed the crime.",
    "reasoning": "Internal game-design rationale linking evidence to the answer.",
    "supportingClueIds": ["clue_2", "clue_4"],
    "redHerrings": ["A misleading but fair detail."]
  }
}
```

This is a conceptual example, not a fixed story to hardcode. The model
must generate a new mystery based on the user's premise. Do not show the
example's answer as an actual game result.

### 8.2 IDs and references

-   Require unique suspect, clue, and hint IDs within each case.
-   Every clue `suspectIds` reference must point to an existing suspect.
-   `privateSolution.culpritId` must match exactly one existing suspect
    ID.
-   Every supporting clue ID must exist.
-   Ensure at least two supporting clues exist and the correct answer is
    supported by the evidence.
-   Prevent the model from adding more/fewer records than the selected
    difficulty requires.
-   Normalize and validate strings; reject empty, excessively long, or
    malformed fields.
-   Use generated internal IDs or safely normalized IDs; never trust
    arbitrary model IDs as database IDs.

### 8.3 Logical consistency validation

Zod validates structure, not detective logic. Add explicit consistency
checks: - Exactly one culprit. - A plausible motive and opportunity. -
The story and suspect statements do not contradict the solution in a way
that makes the case impossible. - Supporting clues genuinely connect to
the culprit or rule out alternatives. - No required clue is impossible
to discover. - The culprit is not stated directly in the public story,
title, public suspect fields, clue text, hint text, or public
metadata. - No clue or hint directly says "X is the culprit" before the
accusation. - The explanation references real clue IDs and explains the
inference. - The solution is deterministically answerable; do not allow
two equally supported culprits.

Where automatic semantic validation cannot guarantee fairness, use a
second constrained validation pass with Gemini if practical, then
perform deterministic schema/reference checks again. Limit retries
(e.g. at most two regeneration attempts after the initial generation) to
control latency and API usage. If generation still fails, return a safe
error and do not save an invalid case.

### 8.4 Public/private data boundary

Use two explicit serializers/types: - `toPublicCase(caseDoc)` returns
only public fields and player progress. - `toPublicResult(caseDoc)`
returns verdict, culprit, explanation, and score breakdown only after
`status === "completed"`.

Never serialize the whole Mongoose document directly to the client. The
private solution must be stored server-side but omitted from every
pre-accusation response. Do not put the private solution in a `data-*`
attribute, hidden React element, HTML comment, frontend environment
variable, browser storage, or client-side constant.

### 8.5 Prompt injection and unsafe content

Treat the user's premise as untrusted creative input. Tell the model to
use it only as a story premise and ignore requests embedded in the
premise that ask it to reveal system instructions, secrets, API keys, or
change application rules. The backend must still validate output and
enforce all rules independently. Keep stories fictional and avoid
unnecessarily graphic content. Limit premise length and reject empty
input.

## 9. Backend architecture and API contract

Organize code clearly, for example:

``` text
server/
  server.js
  app.js
  config/
    db.js
  models/
    Case.js
  routes/
    caseRoutes.js
  controllers/
    caseController.js
  services/
    geminiService.js
    scoringService.js
  validators/
    caseSchemas.js
  serializers/
    caseSerializers.js
  middleware/
    errorHandler.js
    notFound.js
  tests/
```

The exact structure may differ if the repository already has a clean
architecture, but keep route handlers, AI logic, scoring, validation,
and serialization separated.

### 9.1 `POST /api/cases`

Request:

``` json
{
  "premise": "A rare diamond disappeared from a locked museum room.",
  "difficulty": "medium"
}
```

Success (`201 Created`): - `case`: public case ID, title, premise,
story, difficulty, suspects, clue metadata, hint limit, progress, and
status. - Do not include the solution or culprit ID.

Validation: - `premise` is a trimmed string within the configured length
range. - `difficulty` is one of `easy`, `medium`, `hard`. - Rate-limit
creation requests. - If Gemini or MongoDB fails, return a safe error; do
not persist a partial case.

### 9.2 `GET /api/cases/:id`

Returns the active case's public fields and progress. For a completed
case, return only the public case data and a completion status or direct
the client to the result endpoint. Never return private solution fields
from this route, even after completion; use the result endpoint for the
post-accusation reveal.

### 9.3 `POST /api/cases/:id/clues/:clueId/discover`

Request body can be empty.

-   Verify case ID and clue ID.
-   Reject nonexistent clue IDs.
-   Reject discovery after case completion.
-   Record discovery idempotently.
-   Return updated public progress and the newly revealed clue if it was
    previously undiscovered.
-   Repeated discovery must not add duplicate progress or score.

### 9.4 `POST /api/cases/:id/hints`

Request body can be empty.

-   Verify case exists and is active.
-   Enforce difficulty-specific hint count.
-   Return the next unused hint, record its use once, and return updated
    progress.
-   When no hints remain, return `409 Conflict` or a similarly
    consistent domain error.
-   Never include private solution reasoning in hints.

### 9.5 `POST /api/cases/:id/accuse`

Request:

``` json
{
  "suspectId": "suspect_2"
}
```

-   Validate suspect ID and that it belongs to the case.
-   Reject an already completed case with a consistent response or
    return the previously stored result without changing it.
-   Evaluate the accusation on the server.
-   Calculate score from persisted progress and the formula in Section
    7.
-   Persist verdict, accusation, score breakdown, completion time, and
    status.
-   Return the completed result. This is the first endpoint allowed to
    reveal the culprit and solution.
-   Make repeated requests idempotent.

### 9.6 `GET /api/cases/:id/result`

-   If case is not completed, return `409 Conflict` or a consistent
    "case not complete" domain response without leaking any solution
    data.
-   If completed, return verdict, culprit, explanation, score, and score
    breakdown.
-   Never return internal prompts, API credentials, raw Gemini output,
    or private reasoning not intended for the player.

### 9.7 Consistent response and error shape

Use a consistent structure such as:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a premise between 20 and 500 characters."
  }
}
```

Use suitable HTTP codes: - `400` invalid input - `404` missing route or
case - `409` invalid state (case completed, no hints left, or result not
ready) - `429` rate limit - `502` invalid/upstream AI response - `503`
temporary database or AI service unavailability where appropriate -
`500` unexpected server error

Do not expose stack traces in production. Log useful server-side
diagnostic information without secrets or full private solutions.

## 10. MongoDB / Mongoose model

Create a `Case` model with typed/validated fields and timestamps.
Suggested conceptual structure:

``` js
{
  title: String,
  premise: String,
  story: String,
  difficulty: "easy" | "medium" | "hard",
  suspects: [
    {
      id: String,
      name: String,
      role: String,
      description: String,
      statement: String,
      alibi: String,
      publicFacts: [String]
    }
  ],
  clues: [
    {
      id: String,
      title: String,
      description: String,
      location: String,
      significance: String,
      suspectIds: [String]
    }
  ],
  hints: [
    { id: String, text: String }
  ],
  privateSolution: {
    culpritId: String,
    motive: String,
    explanation: String,
    reasoning: String,
    supportingClueIds: [String],
    redHerrings: [String]
  },
  progress: {
    discoveredClueIds: [String],
    usedHintIds: [String]
  },
  accusation: {
    suspectId: String,
    isCorrect: Boolean,
    submittedAt: Date
  },
  status: "active" | "completed",
  score: {
    basePoints: Number,
    cluePoints: Number,
    hintPenalty: Number,
    finalScore: Number
  },
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Adjust the exact schema to Mongoose conventions. Validate enums and
required values at both application and schema level. Add indexes if
needed for status/creation date cleanup. Use `createdAt` and `updatedAt`
timestamps.

For hints, the player must not receive the full unused-hint list as part
of the public case response. Return only hint count/limit and previously
used hints that are safe to display. The next hint is returned only when
the hint endpoint is called.

For clues, if clues are intended to be discoverable, do not expose
undiscovered clue descriptions in the initial response. The initial
public payload may include safe clue metadata such as ID and discovered
state, but hidden clue text should be returned only when that clue is
discovered. Choose one consistent API representation and use it across
frontend, tests, and serializers.

## 11. Frontend architecture and state

Suggested structure:

``` text
client/
  src/
    components/
    pages/
      HomePage.jsx
      CreateMysteryPage.jsx
      InvestigationPage.jsx
      ResultsPage.jsx
      NotFoundPage.jsx
    services/
      api.js
    hooks/
    utils/
    App.jsx
    main.jsx
    index.css
```

-   Configure one Axios instance with a base URL from a public frontend
    variable such as `VITE_API_BASE_URL`.
-   Never put Gemini or MongoDB credentials in `VITE_*` variables.
-   Use React Router for navigation.
-   Keep server-owned case progress in API responses; do not invent
    local scoring.
-   On page load, fetch the case from the backend.
-   Use component state for loading/error/selection states.
-   Avoid unnecessary global state libraries for this MVP.
-   Disable controls during requests and provide accessible
    success/error feedback.
-   Do not persist secret solution information in
    localStorage/sessionStorage.
-   Browser storage may store only non-sensitive UI preferences if
    useful.

## 12. Environment variables

`server/.env` (never commit real credentials):

``` dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
GEMINI_API_KEY=<your_gemini_api_key>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Frontend `.env` (only if required):

``` dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Create `.env.example` files with placeholders. Add `.env`, `.env.*`,
`node_modules/`, `dist/`, coverage output, and other generated files to
`.gitignore`, while allowing `.env.example` to be committed.

Validate required backend environment variables on startup. Fail with a
clear server-side message if required variables are missing, without
printing the secret values. Do not use a production wildcard CORS policy
unless there is a deliberate, documented reason.

## 13. Security and reliability requirements

-   Keep all secrets in backend environment variables.
-   Use Helmet and restricted CORS.
-   Validate all request bodies, parameters, difficulty values, IDs, and
    lengths.
-   Apply rate limiting to mystery generation and state-changing
    endpoints.
-   Do not expose private solution fields in public serializers.
-   Never trust client-supplied score, clue count, hint count, or
    correctness.
-   Make discovery, hint use, and accusation idempotent/race-safe.
-   Handle MongoDB errors, Gemini errors, timeouts, rate limits, and
    malformed output.
-   Use bounded retries; do not retry endlessly.
-   Avoid logging API keys, credentials, raw secrets, or full solution
    objects.
-   Do not execute or evaluate AI-generated code.
-   Add reasonable request size limits.
-   Use generic public error messages and detailed but safe server-side
    logs.
-   Provide a health endpoint such as `GET /api/health` that reports
    application status without exposing secrets or database connection
    details.
-   Consider expiry/cleanup for old active cases if practical; do not
    add a cleanup process that can delete cases during the demo.
-   Do not claim full authorization/privacy for an unauthenticated app.
    For MVP, use unguessable IDs, rate limits, and avoid sensitive user
    data. If stronger per-user privacy becomes a requirement, add
    authentication as a separate scope.

## 14. Testing requirements

Write automated tests for at least:

### Scoring unit tests

-   Correct accusation at each difficulty.
-   Wrong accusation receives no base points.
-   Clue points are added correctly.
-   Hint penalty is applied correctly.
-   Score never falls below zero.
-   Duplicate clue/hint IDs do not count twice.

### Validation tests

-   Invalid difficulty rejected.
-   Empty/too-short/too-long premise rejected according to configured
    rules.
-   Wrong number of suspects/clues/hints rejected.
-   Duplicate IDs rejected.
-   Unknown culprit ID rejected.
-   Invalid clue/suspect references rejected.
-   Missing supporting clues rejected.

### API and security tests

-   Public case response does not contain `privateSolution`,
    `culpritId`, private reasoning, or secret-bearing fields before
    accusation.
-   Result endpoint does not reveal a solution for an active case.
-   Correct accusation completes a case and returns a valid score.
-   Wrong accusation completes a case without base points.
-   Duplicate clue discovery is idempotent.
-   Hint limit is enforced.
-   Completed cases cannot be mutated.
-   Missing case returns 404.
-   Gemini failure returns a safe error and no invalid case is stored.

Use a mocked Gemini service in automated tests so tests do not require
paid API calls or network access. Include a separate manual
integration-test procedure for a real Gemini key and MongoDB instance.

## 15. Definition of done / acceptance criteria

The project is not complete until all applicable items are verified:

-   [ ] Home page has a polished detective-themed design.
-   [ ] All required routes work and unknown routes show a 404 page.
-   [ ] Premise and difficulty form validation works.
-   [ ] Easy, Medium, and Hard generate the exact required counts.
-   [ ] Gemini responses are schema-validated and checked for
    consistency.
-   [ ] Cases and progress persist in MongoDB.
-   [ ] Public API responses do not reveal the solution before
    accusation.
-   [ ] Clues can be discovered and are revealed only as intended.
-   [ ] Duplicate clue discovery does not double-count.
-   [ ] Hints are limited and deducted once per used hint.
-   [ ] Accusations are validated on the backend.
-   [ ] Scores are calculated on the backend according to Section 7.
-   [ ] Results show the correct verdict, culprit, explanation, and
    score breakdown.
-   [ ] API and network errors have useful user-facing messages.
-   [ ] Responsive layout works on mobile, tablet, and desktop.
-   [ ] Keyboard navigation and visible focus work for essential
    interactions.
-   [ ] Automated tests for scoring, validation, and answer privacy
    pass.
-   [ ] No real secrets are committed to GitHub.
-   [ ] Backend and frontend are deployed.
-   [ ] Production environment variables and CORS are configured.
-   [ ] A full mystery has been created and solved on the live website.
-   [ ] README contains setup, environment, test, and deployment
    instructions.

## 16. Deployment requirements

### Backend

Deploy to a Node.js-compatible hosting provider. Configure: -
`MONGODB_URI` - `GEMINI_API_KEY` - `CLIENT_URL` (production frontend
origin) - `NODE_ENV=production` - `PORT` as provided by the host

Ensure the server binds to the host-provided port and listens on the
correct interface. Configure the host's health check to use
`/api/health` or the chosen health route.

### Database

-   Create a MongoDB Atlas database and database user with only the
    required permissions.
-   Configure network access securely for the chosen host where
    feasible.
-   Use URL-encoded credentials when needed.
-   Never commit the connection string.

### Frontend

Deploy the Vite build to Vercel or a compatible static hosting provider.
Set `VITE_API_BASE_URL` to the deployed backend's `/api` base path.
Configure SPA route rewrites if required so refreshing
`/investigation/:id` and `/results/:id` loads the React app.

### Production smoke test

On the actual live website: 1. Create an Easy case. 2. Discover two
clues. 3. Use one hint. 4. Make an accusation. 5. Confirm the result and
score. 6. Start another case. 7. Repeat at least one case on mobile
width. 8. Inspect the network responses before accusation to confirm no
culprit or solution is exposed. 9. Confirm no secrets appear in the
deployed frontend bundle or GitHub repository.

## 17. README requirements

Create a `README.md` containing: - Project summary and key features. -
Technology stack. - Folder structure. - Prerequisites. - Local setup
commands for frontend and backend. - Environment variables and
`.env.example` references. - How to run tests. - How to run both
services locally. - Deployment steps. - API endpoint summary. - Security
note explaining that the backend protects the solution. - Live website
URL and GitHub repository URL when available. - Known limitations,
stated honestly.

## 18. Suggested implementation sequence for Codex

Implement in this order and run checks at each stage:

1.  **Repository inspection and plan:** inspect files, confirm stack,
    summarize implementation plan.
2.  **Project setup:** configure frontend, backend, scripts, lint/test
    tooling if useful, environment examples, and README skeleton.
3.  **Design system and static UI:** build all page layouts and reusable
    components with sample non-secret fixture data; ensure responsive
    design and accessibility.
4.  **Backend foundation:** Express app, health endpoint, environment
    validation, MongoDB connection, error middleware, CORS, and rate
    limiting.
5.  **Database and serializers:** Mongoose schema, validators, explicit
    public/result serializers.
6.  **Gemini service:** structured output, Zod validation, consistency
    checks, bounded retry logic, and safe failures.
7.  **Game API:** create case, fetch public case, discover clue, request
    hint, accuse, retrieve result.
8.  **Scoring and state integrity:** implement server-owned score
    calculation, idempotency, and completed-case protections.
9.  **Frontend integration:** Axios service, loading/error states, real
    case persistence, refresh behavior, clue/hint/accusation
    interactions.
10. **Tests:** scoring, schema validation, API behavior, and
    solution-leak prevention.
11. **Visual refinement:** improve typography, spacing, evidence-board
    composition, responsive behavior, hover/focus states, and
    reduced-motion handling.
12. **Production readiness:** review secrets, CORS, API URLs, build
    commands, and logs.
13. **Deployment and smoke test:** deploy database/backend/frontend and
    verify the entire live journey.
14. **Final report:** list implemented features, tests actually run and
    their outcomes, deployed URLs if available, and any remaining
    limitations.

## 19. Final instructions to Codex

Do not stop after writing a plan. After inspecting the repository, begin
implementing the application in manageable stages. Keep the project
runnable throughout. Run the relevant tests and build commands, diagnose
failures, and fix them rather than merely reporting them.

The finished product must look and feel like a cohesive, premium
detective mystery experience. Visual quality is a core acceptance
criterion, but it must not come at the expense of functional gameplay,
answer privacy, or reliable scoring.

If a decision is blocked by missing credentials (Gemini or MongoDB),
finish all code that can be implemented and tested with mocks, clearly
identify the exact missing setup step, and continue with the rest of the
work. Never fabricate successful integration or deployment.
