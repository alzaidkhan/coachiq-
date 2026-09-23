# CoachIQ — Cricket Coaching & Match Analytics

CoachIQ is a comprehensive cricket coaching, performance analytics, and training planning platform built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Express**. It helps cricket players and coaches track match performance, visualize shot distributions with radial wagon wheels, follow structured weekly training programs, and receive biomechanical coaching guidance.

---

## Features

### 1. Cricket Coaching & Technical Guidance
- Detailed coaching recommendations tailored to your player profile, skill tier, and batting/bowling specialties.
- Structured technical focus on batting mechanics (stance, backlift, trigger movements, contact point), fast and spin bowling variations, wicketkeeping, and fielding agility.
- Practical 3-step practice drills for immediate nets and field training.

### 2. Interactive 360° Wagon Wheel & Stadium Arena
- Visual stadium map with 8 radial scoring zones (Cover, Point, Third Man, Mid-Off, Mid-On, Mid-Wicket, Square Leg, Fine Leg).
- Shot trajectory visualization from crease to boundary ropes.
- Boundary percentages, scoring corridors, and strike-rotation analysis.

### 3. Match Analytics & Scorebook
- Comprehensive match logging (runs, balls faced, boundaries, dismissals, overs, wickets, economy, catches).
- Automated career metrics, strike rate calculations, phase analysis (Powerplay, Middle, Death overs), and performance trends.
- Local JSON export and import for easy backup and restore across devices.

### 4. Training Planner & 50+ Drill Library
- Periodized weekly training schedules based on match schedules and available training days.
- Filterable drill catalog covering batting, pace bowling, spin bowling, fielding reflexes, power hitting, and fitness conditioning.

### 5. Private Device Storage
- All player metrics, match logs, and training schedules remain saved directly in your browser.
- Fast, responsive offline capabilities.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Recharts, Lucide Icons, Wouter
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **AI Engine**: Google Gemini API via `@google/genai` SDK
- **Testing**: Vitest with unit and integration test suites

---

## Getting Started

### Prerequisites
- **Node.js**: Version `20.19+` or `22+`
- **npm**: Version `10+`

### Quick Start

```bash
# 1. Clone or navigate to the repository
cd coachiq

# 2. Install dependencies
npm install

# 3. Create your local environment configuration
cp .env.example .env

# 4. Start the development server
npm run dev
```

Visit `http://localhost:3000` in your web browser.
