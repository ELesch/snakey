# Snakey - Reptile Care Tracker

A Progressive Web Application (PWA) for reptile owners to track comprehensive care data including feedings, sheds, weights, environmental conditions, health records, and breeding information.

## Features

- **Offline-First**: Works without internet, syncs when connected
- **Species-Specific Care Guidelines**: Built-in care parameters for 15+ reptile species
- **Comprehensive Tracking**:
  - Feeding schedules and history
  - Shed cycles and quality
  - Weight tracking with trends
  - Temperature and humidity monitoring
  - Health records and vet visits
  - Breeding and clutch management
- **PWA Support**: Install on any device for native-like experience
- **Real-time Sync**: Data syncs across devices when online

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 7
- **Styling**: Tailwind CSS v4
- **Offline Storage**: Dexie (IndexedDB)
- **PWA**: Serwist
- **Charts**: Recharts + Tremor

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Generate Prisma client
npm run db:generate

# Push database schema (development)
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for required environment variables.

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are colocated with source files (e.g., `ReptileService.test.ts` next to `ReptileService.ts`).

## API Response Format

All API endpoints follow a standardized response format:

```json
// Success (single resource)
{
  "data": {
    "id": "...",
    "name": "..."
  }
}

// Success (list)
{
  "data": [...],
  "meta": {
    "count": 10
  }
}

// Error
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

### HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

## Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (dev)
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Deployment

The app is configured for deployment on Vercel:

```bash
npm run build
```

## Project Structure

```
snakey/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (app)/          # Authenticated app routes
│   │   ├── (auth)/         # Auth routes (login, register)
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── layout/        # Layout components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── reptiles/      # Reptile-related components
│   │   ├── pwa/           # PWA components
│   │   └── providers/     # Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and services
│   │   ├── db/           # Database client
│   │   ├── offline/      # Offline storage
│   │   ├── pwa/          # PWA utilities
│   │   ├── species/      # Species configurations
│   │   ├── supabase/     # Supabase client
│   │   └── validations/  # Zod schemas
│   └── test/             # Test setup
├── prisma/               # Database schema and migrations
├── public/              # Static assets
│   ├── icons/          # PWA icons
│   └── manifest.json   # PWA manifest
└── .claude/            # Claude Code orchestrator framework
```

## Claude Code Integration

This project uses the Claude Code orchestrator pattern for AI-assisted development. See `.claude/` for:

- Agent definitions
- Development checklists
- Project status tracking
- Tech stack documentation

## License

Private - All rights reserved
