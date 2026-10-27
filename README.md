# AI Mystery Room

An AI-powered detective game built with React, Express, MongoDB, and Google Gemini AI. Players create mysteries from custom premises, investigate evidence dossiers, request clues and hints within strict difficulty limits, submit accusations in a dedicated accusation chamber, and receive server-validated verdicts with complete score breakdowns.

---

## Features

- **Dynamic Case Generation**: Mysteries crafted using Google Gemini (`@google/genai`) tailored to three balanced difficulty tiers:
  - **Easy**: 3 suspects, 5 clues, 2 hints (Base 100 points).
  - **Medium**: 4 suspects, 7 clues, 3 hints (Base 150 points).
  - **Hard**: 5 suspects, 9 clues, 3 hints (Base 200 points).
- **Interactive Evidence Ledger**: Locked clue cards that are revealed only upon deliberate examination.
- **Dedicated Accusation Chamber (`/accuse/:id`)**: Formally review suspect dossiers, select a suspect, verify confirmation, and close the case.
- **Server-Owned Scoring & State Protection**:
  - Correct accusation awards difficulty base points (100 / 150 / 200).
  - Each unique discovered clue awards +5 bonus points.
  - Each requested hint incurs a −10 point penalty.
  - Score is clamped at a minimum of 0 points.
  - All scoring is strictly computed and validated on the backend.
- **Strict Solution Privacy**:
  - The server explicitly strips culprit identity, motive, internal reasoning, and secret answers from all active-game API responses.
  - The solution and verdict are revealed only after the case is marked completed via a validated accusation.
- **Idempotent Mutations & Anti-Tampering**: Duplicate clue discoveries, repeated hint calls, and duplicate accusations are guarded against race conditions and cannot artificially alter the score.

---

## Tech Stack

| Tier | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 6 | Fast SPA rendering & interactive gameplay |
| **Styling** | Tailwind CSS & Vanilla CSS | Curated detective case room design system |
| **Icons** | Lucide React | Contextual evidence, dossier, and navigational iconography |
| **Routing** | React Router 7 | Client-side routing with SPA rewrite support |
| **HTTP Client** | Axios | Resilient API communication with timeout handling |
| **Backend** | Node.js, Express 5 | REST API server with security middleware |
| **Database** | MongoDB & Mongoose 8 | Case persistence with private fields projection |
| **AI Integration** | Google GenAI SDK (`@google/genai`) | Structured, fair mystery narrative generation |
| **Schema Validation** | Zod 4 | Strict input and AI response validation |
| **Security** | Helmet, CORS, Express-Rate-Limit | Header hardening, origin restriction, and abuse prevention |
| **Testing** | Vitest, Testing Library, Node Test Runner | Comprehensive unit, API, and E2E coverage |

---

## Application Pages & Routes

1. **Home (`/`)**: Project introduction, detective atmosphere, and entry point.
2. **Create Mystery (`/create`)**: Premise input (20–500 chars), sample premise shortcut, and difficulty selection.
3. **Investigation Room (`/investigation/:id`)**: Case briefing, suspect dossiers, examine-clue ledger, hint drawer, and case progress.
4. **Accusation Chamber (`/accuse/:id`)**: Dedicated suspect selection, alibi comparison, explicit confirmation, and case closure.
5. **Results (`/results/:id`)**: Verdict banner (Case Solved / Wrong Suspect), culprit dossier, case explanation, and itemized score breakdown.
6. **Not Found (`*`)**: Designed detective-themed 404 page with return-to-office navigation.

---

## Repository Structure

```text
ai-mystery-room/
├── client/                     # Vite + React frontend workspace
│   ├── src/
│   │   ├── App.jsx             # Routes & page components (Home, Create, Investigation, Accuse, Results)
│   │   ├── App.test.jsx        # Frontend route, accusation, and results tests
│   │   ├── index.css           # Detective design system tokens & responsive layouts
│   │   ├── main.jsx            # React root & BrowserRouter mount
│   │   ├── testSetup.js        # Vitest setup
│   │   └── services/
│   │       └── api.js          # Axios API client
│   ├── .env.example            # Frontend environment template
│   ├── package.json            # Client dependencies & scripts
│   ├── vercel.json             # Vercel SPA routing rewrite rules
│   └── vite.config.js          # Vite & Vitest configuration
├── server/                     # Express + Mongoose backend workspace
│   ├── src/
│   │   ├── app.js              # Express app, security middleware & API endpoints
│   │   ├── gemini.js           # Google GenAI mystery prompt & response parsing
│   │   ├── model.js            # Mongoose Case model with privateSolution { select: false }
│   │   ├── rules.js            # Difficulty definitions and scoring calculations
│   │   ├── schemas.js          # Zod schemas for input and AI output validation
│   │   ├── serializers.js      # Public data sanitizers protecting the solution
│   │   └── server.js           # Startup listener & MongoDB connection
│   ├── test/
│   │   ├── api.test.js         # API integration & E2E game journey tests
│   │   └── rules.test.js       # Scoring, schema validation, and serializer tests
│   ├── .env.example            # Server environment template
│   └── package.json            # Server dependencies & scripts
├── package.json                # Root npm workspace configuration
├── README.md                   # Project documentation
├── SPEC.md                     # Engineering & product specification
└── .gitignore                  # Exclusion rules for secrets, node_modules, and dist
```

---

## Local Development Setup

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- (Optional for offline testing) Server and client tests run fully offline without external credentials.
- (For live gameplay) A MongoDB Atlas connection URI and a Google Gemini API Key.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create your local server configuration from the template:
```bash
# On Windows PowerShell:
Copy-Item server/.env.example server/.env

# On macOS / Linux:
cp server/.env.example server/.env
```

Edit `server/.env`:
```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mystery_room?retryWrites=true&w=majority
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

*(Optional)* Create `client/.env` if your API runs on an external host; otherwise, Vite automatically proxies `/api` requests to `http://localhost:5000`:
```dotenv
VITE_API_BASE_URL=/api
```

### 3. Run Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Running Automated Tests

Run the complete test suite across both workspaces:
```bash
npm test
```

Or run tests individually:
```bash
# Server tests (scoring rules, Zod validation, security serializers, E2E game flow)
npm test -w server

# Client tests (routes, navigation, Accusation selection/confirmation, Results breakdown)
npm test -w client
```

Build the client production bundle:
```bash
npm run build -w client
```

---

## Production Deployment Guide

### A. Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a cluster (M0 Free tier is sufficient).
3. Under **Database Access**, create a database user with read/write privileges.
4. Under **Network Access**, whitelist your backend hosting IP or allow access from anywhere (`0.0.0.0/0`) with strong user credentials.
5. Copy your connection string and replace `<username>` and `<password>`.

### B. AI API Key (Google AI Studio)
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API key.
3. Keep this key strictly on the server; never expose it in frontend files.

### C. Backend Deployment (e.g., Render / Railway / Heroku)
1. Connect your repository to the hosting provider.
2. Set root directory to `server` (or run build/start from root: `npm start -w server`).
3. Set environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: (provided automatically by host)
   - `MONGODB_URI`: your MongoDB Atlas URI
   - `GEMINI_API_KEY`: your Google Gemini API key
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CLIENT_URL`: your deployed frontend origin (e.g. `https://your-mystery-room.vercel.app`)
4. Health check endpoint: `/api/health`

### D. Frontend Deployment (Vercel)
1. Import your repository into [Vercel](https://vercel.com/).
2. Set **Root Directory** to `client`.
3. Set Framework Preset to **Vite**.
4. Set Environment Variables:
   - `VITE_API_BASE_URL`: your deployed backend API URL (e.g. `https://your-api.onrender.com/api`).
5. Vercel utilizes [client/vercel.json](client/vercel.json) to handle Single Page Application rewrites for `/create`, `/investigation/:id`, `/accuse/:id`, and `/results/:id`.

---

## Live Production Verification Checklist

1. [ ] Generate an **Easy** case (verify 3 suspects, 5 clues, 2 hints).
2. [ ] Examine/discover 2 clues (verify clue count increments, description is logged).
3. [ ] Request 1 hint (verify hint text appears, remaining hints decrement).
4. [ ] Navigate to `/accuse/:id` (verify suspect cards display without solution leaks).
5. [ ] Select a suspect, check confirmation checkbox, and click submit.
6. [ ] Confirm redirect to `/results/:id` (verify correct/incorrect verdict, culprit reveal, case explanation, and accurate score math).
7. [ ] Click "Play another case" to start a new investigation.
8. [ ] Verify responsiveness on desktop and mobile viewports.
