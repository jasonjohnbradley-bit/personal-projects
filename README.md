# Travel Itinerary Planner

A beautiful, AI-powered travel itinerary planner built with Next.js, React, and Claude AI. Create personalized travel plans with drag-and-drop scheduling, interactive maps, and smart recommendations.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **AI-Powered Itineraries** - Claude AI generates personalized travel plans based on your preferences
- **Drag & Drop Scheduling** - Easily reorder activities and swap alternatives into your schedule
- **Interactive Maps** - View all locations on a Leaflet map with custom markers
- **Activity Management** - Add, edit, remove, and restore activities
- **Auto-Save** - Changes are automatically saved to the database
- **Export** - Download your itinerary as a text file
- **Responsive Design** - Works beautifully on desktop and mobile
- **Ghibli-Inspired Theme** - Soft, whimsical design with pastel colors

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **AI**: Claude API (Anthropic)
- **Maps**: Leaflet + React Leaflet
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- Anthropic API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jasonjohnbradley-bit/travel-planner.git
   cd travel-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your values:
   ```
   DATABASE_URL=postgresql://...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── activities/[id]/    # Activity CRUD
│   │   ├── days/[dayId]/       # Day activities
│   │   ├── health/             # Health check
│   │   └── plans/              # Plan CRUD
│   ├── dashboard/              # Plan listing
│   ├── plan/[id]/              # Plan view
│   └── page.tsx                # Home/create form
├── components/
│   ├── itinerary/              # Activity cards, modals
│   ├── map/                    # Leaflet map components
│   └── ui/                     # Shared UI components
├── hooks/
│   ├── useDragAndDrop.ts       # Drag & drop logic
│   └── useItinerary.ts         # State management
├── lib/
│   ├── claude/                 # AI integration
│   ├── db/                     # Database schema & queries
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # Utilities
└── drizzle/                    # Database migrations
```

## Usage

### Creating an Itinerary

1. Enter your destination (e.g., "Tokyo, Japan")
2. Select trip duration (1-14 days)
3. Choose your preferences:
   - Cuisine types
   - Coffee interest level
   - Cultural interests
   - Shopping preferences
   - Activity level
4. Add any specific places you want to visit
5. Click "Create My Itinerary"

### Managing Your Itinerary

- **Drag activities** to reorder them within a day
- **Drag alternatives** into the main schedule to swap them in
- **Click the edit button** (✏️) to modify activity details
- **Click the remove button** (✕) to remove activities
- **Restore removed items** from the "Removed Items" section
- **Add new activities** using the "+ Add Activity" button

### Exporting

Click the "Export" button to download your itinerary as a formatted text file.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plans` | GET | List all plans |
| `/api/plans` | POST | Create new plan |
| `/api/plans/[id]` | GET | Get plan details |
| `/api/plans/[id]` | PATCH | Update activity positions |
| `/api/plans/[id]` | DELETE | Delete plan |
| `/api/activities/[id]` | PATCH | Update activity |
| `/api/days/[dayId]/activities` | POST | Create activity |
| `/api/health` | GET | Health check |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `ANTHROPIC_API_KEY`
4. Deploy

The `vercel.json` is pre-configured with extended function timeouts for AI generation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key from Anthropic |

## License

MIT

## Acknowledgments

- Design inspired by Studio Ghibli's whimsical aesthetic
- Built with [Claude Code](https://claude.ai/claude-code)
