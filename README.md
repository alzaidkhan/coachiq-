# CoachIQ — Masterclass Cricket Coaching & Match Analytics

CoachIQ is a high-performance cricket coaching and match analytics web application built with React, Vite, Express, TypeScript, and Tailwind CSS. It empowers cricket players of all skill levels to track match performance, visualize scoring wagon wheels, follow personalized training plans, and receive biomechanically sound technical coaching.

---

## Key Features

### 1. Masterclass AI Cricket Coach
- **Biomechanical Technical Precision**: Delivers actionable advice on batting mechanics (grip, stance, backlift, trigger movements, head-over-ball alignment, bat path), bowling technique (run-up cadence, gather, seam presentation, front-knee brace, wrist release), fielding, and wicketkeeping.
- **Player Context Integration**: Considers the player's role (batter, bowler, all-rounder, keeper), skill level, batting hand, bowling style, weekly training load, and recent match statistics.
- **Security & Injection Hardening**: Implements a dedicated cricket lexicon validator, regex filters, and strict boundary checks to neutralize prompt injection, jailbreaking, and off-topic abuse.
- **Reliable Fallbacks**: If upstream AI services are rate-limited or unavailable, CoachIQ utilizes a high-IQ contextual cricket knowledge engine so players always receive expert guidance.

### 2. Interactive 360° Scoring Wagon Wheel & Arena
- **Click-to-Enlarge Scoring Map**: In the dashboard, clicking directly on the scoring zone visual or selecting "Detailed wagon wheel" expands a full-screen interactive stadium arena (`WagonWheelDialog`).
- **8-Zone Radial Sectors**: Maps shot distribution across Third Man, Point, Cover, Mid-Off, Mid-On, Mid-Wicket, Square Leg, and Fine Leg with custom theme colors.
- **Dual View Modes**:
  - *Zones View*: Interactive sector nodes with glow effects, run volume badges, and relative shot density rankings.
  - *Trajectories Mode*: Renders individual shot lines radiating from the batter's crease toward the boundary ropes.
- **Pitch-Level Graphic**: High-precision SVG stadium layout complete with 75m boundary rope, 30-yard fielding circle, pitch strip, popping crease, stumps, and stance coordinates.
- **Google AI Tactical Breakdown**: Real-time evaluation of the batter's strongest corridors and predictive opposition fielding placements.

### 3. Match-by-Match Analytics & Trends
- **Batting Rhythm**: Line charts tracking runs scored and boundary counts across matches.
- **Bowling Output**: Bar charts detailing wickets taken and economy rates per spell.
- **Dismissal Trends**: Visual breakdown of dismissal patterns (bowled, caught, LBW, run out, stumped) to identify technical vulnerabilities.
- **Phase Performance**: Bowling analysis grouped by phase (Powerplay, Middle overs, Death overs).
- **Match Scorebook**: Full tabular log with quick edit/delete controls and local persistence.

### 4. Training Planner & Drill Library
- **Structured Drills**: Curated drills for batting, bowling, fielding, fitness, and mental focus.
- **Weekly Schedule**: Automated session planning aligned with player goals and available practice days.
- **Data Export & Import**: Local browser storage with one-click JSON backup and restore capabilities.

### 5. Private Owner Feedback Desk (`/admin`)
- **Feedback Management**: Players can submit feedback, bug reports, and coaching ideas.
- **Secure Access Control**: Authenticated via `COACHIQ_ADMIN_ACCESS_KEY` using constant-time cryptographic comparisons (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Status Workflow**: Filter and manage notes by status (`new`, `reviewed`, `resolved`) with two-step in-app confirmation for safe deletion.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Wouter routing
- **Backend**: Express, Node.js, TypeScript, Drizzle ORM
- **Database**: MySQL / TiDB (with automatic in-memory fallback for local development)
- **AI Engine**: Google Gemini API (`gemini-3.8-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite`) or custom OpenAI-compatible endpoints
- **Testing**: Vitest with comprehensive unit and integration test coverage

---

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22+
- npm (v10+)

### Installation

```bash
# Install dependencies
npm install

# Start the development server (port 3000)
npm run dev
```

Visit `http://localhost:3000` to view CoachIQ.

### Building for Production

```bash
# Build frontend and server bundles
npm run build

# Start the production server
npm start
```

### Running Tests

CoachIQ includes 13 test suites covering AI context generation, security validation, match analytics, and admin authentication:

```bash
npm test
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure your environment:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Optional (default: `3000`) | Port on which the Express server listens |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for the AI Coach |
| `GOOGLE_GENAI_API_KEY` | Optional | Alternative Google GenAI API key for the AI Coach |
| `AI_API_KEY` | Optional | API key for custom OpenAI-compatible endpoints |
| `AI_API_BASE_URL` | Optional | Base URL for custom AI endpoints (e.g., `https://api.openai.com/v1`) |
| `AI_MODEL` | Optional | Primary AI model identifier (defaults to `gemini-3.8-flash`) |
| `AI_FALLBACK_MODEL` | Optional | Secondary fallback model identifier |
| `DATABASE_URL` | Optional | MySQL connection string for feedback and shared daily AI budget |
| `COACHIQ_ADMIN_ACCESS_KEY` | Optional | Secret key required to access the `/admin` feedback desk |

*Note: If no database or AI API key is configured, CoachIQ automatically runs with in-memory persistence and offline coaching fallback answers.*

---

## Security Architecture

1. **AI Input Defense**: CoachIQ inspects every coaching query with `validateCoachQuestion`, rejecting non-cricket queries, prompt injection attempts, and excessive payload sizes.
2. **Server-Side API Proxying**: API keys (`GEMINI_API_KEY`, `AI_API_KEY`) are kept strictly on the Express backend and are never sent to client browsers.
3. **Content Security Policy (CSP)**: Strict headers deployed across all routes (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` on `/api/*`, explicit script/style/font/img directives).
4. **SQL Injection Prevention**: All database queries in `feedbackStore.ts` utilize parameterized queries (`?`).
5. **Rate Limiting**: Sliding-window rate limiters prevent API spam on `/api/coach`, `/api/dashboard-insights`, `/api/feedback`, and `/api/admin/*`.
6. **No Stored PII**: Player profiles and match scorecards remain in the user's browser local storage by default.

---

## License

MIT License. Crafted for cricketers and coaches worldwide.
