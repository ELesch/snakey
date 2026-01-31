# Snakey - Onboarding Guide

Welcome to the Snakey project! This guide will help you set up your development environment and get the project running.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** or **pnpm** package manager
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - TypeScript

## Step 1: Clone and Install

```bash
# Navigate to the project
cd snakey

# Install dependencies
npm install
```

## Step 2: Set Up Supabase (Database)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be provisioned (takes 1-2 minutes)

### Get Connection Details

1. In your Supabase dashboard, go to **Settings > Database**
2. Find the **Connection string** section
3. Copy the **URI** (connection string)

### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

   Find these values in:
   - **Project URL**: Settings > API > Project URL
   - **Anon Key**: Settings > API > Project API Keys > anon public
   - **Service Role Key**: Settings > API > Project API Keys > service_role (keep secret!)

## Step 3: Create the Database Schema

Snakey uses a dedicated `snakey` schema in your Supabase database for isolation (allows sharing one database across multiple projects).

### Create the Schema in Supabase

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Paste and run the contents of `prisma/create-schema.sql`:

```sql
-- Create the 'snakey' schema
CREATE SCHEMA IF NOT EXISTS snakey;

-- Grant usage to authenticated users (for RLS)
GRANT USAGE ON SCHEMA snakey TO postgres, anon, authenticated, service_role;

-- Grant all privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA snakey
GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
```

4. Click **Run** to execute

### Push the Prisma Schema

```bash
# Generate Prisma client (outputs to src/generated/prisma)
npm run db:generate

# Push schema to database (creates tables in 'snakey' schema)
npm run db:push

# Optional: Open Prisma Studio to view data
npm run db:studio
```

## Step 4: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Step 5: Set Up Authentication (Optional)

Supabase provides built-in authentication. To enable:

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable Email/Password (enabled by default)
3. Optionally enable social providers (Google, GitHub, etc.)

## Common Tasks

### Running Tests

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### Database Changes

```bash
npm run db:generate    # Regenerate client after schema changes
npm run db:push        # Push schema changes (development)
npm run db:migrate     # Create migration (production)
```

### Building for Production

```bash
npm run build          # Build production bundle
npm run start          # Start production server
```

## Project Configuration

### Tech Stack Confidence Levels

Check `.claude/tech/stack.md` for AI confidence levels. Technologies with "Medium" or "Low" confidence may need extra verification.

### PWA Icons

The `public/icons/` directory needs icon files. See `public/icons/README.md` for generation instructions.

## Troubleshooting

### "Cannot find module '@/generated/prisma/client'"

Run `npm run db:generate` to generate the Prisma client.

### Database connection errors

1. Check your `.env.local` credentials
2. Ensure your IP is allowed in Supabase (Settings > Database > Network)
3. Try the DIRECT_URL instead of DATABASE_URL for migrations

### "schema 'snakey' does not exist"

Run the schema creation SQL in Supabase SQL Editor (see Step 3 above) before running `npm run db:push`.

### PWA not working in development

Service workers are disabled in development mode. Build and serve to test PWA features:
```bash
npm run build && npm run start
```

## Getting Help

- Check `.claude/LEARNINGS.md` for discovered patterns and solutions
- Review `.claude/tech/stack.md` for technology gotchas
- Run `/tech-revalidate` if patterns seem outdated

## Next Steps

1. Add your first reptile via the dashboard
2. Explore the species care guidelines
3. Test offline functionality by going offline and making changes
4. Install the PWA on your device for the best experience
