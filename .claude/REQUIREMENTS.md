# Requirements: Snakey

> Captured specifications and requirements. Updated by `/capture` skill.

## Core Features

### Reptile Profile Management

- Add/edit reptile profiles with:
  - Species (with species-specific defaults)
  - Name, morph/genetics, acquisition date
  - Age/birthdate (if known)
  - Sex (male/female/unknown)
  - Current weight

### Shedding Cycle Tracking

- Log pre-shed signs (blue eyes, dull coloration, hiding)
- Record successful sheds with date
- Track shed quality (complete/partial, issues)
- Shed progression photo documentation
- Historical shed cycle intervals visualization

### Environmental Monitoring

- Species-specific temperature/humidity target ranges
- Log temperature/humidity readings
- Alerts when readings fall outside safe ranges
- Temperature/humidity history graphs

### Feeding Management

- Log feedings with prey type, size, source, acceptance
- Feeding frequency analysis
- Acceptance rate tracking

### Breeding Records

- Brumation tracking (cooling periods)
- Pairing records (male/female/dates)
- Clutch records (lay date, egg count)
- Incubation tracking
- Hatch records with outcomes

### Veterinary Care

- Vet visit log (date, reason, diagnosis, treatment)
- Medication schedules and reminders
- Parasite treatment tracking
- Exportable vet records (PDF format)

### Photo Gallery

- Per-pet photo gallery
- Timeline/date-stamped photo log
- Before/after comparison views
- Shed progression photo series

### Data Visualization

- Weight curves over time
- Feeding frequency and acceptance rates
- Shed cycle interval trends
- Temperature/humidity logs
- Cost tracking (food, vet, supplies)

### PWA Offline Capabilities

- View all pet data and history offline
- Log feedings/weights/observations offline
- View cached photos offline
- Background sync when connectivity restored

### Sharing Features

- Shareable pet profile links/cards (public view)
- QR code generation for pet profiles
- Vet visit data export (PDF)

## Non-Functional Requirements

### Authentication

- Email/password authentication via Supabase Auth
- Single user per account
- Secure photo storage per user

### Offline-First Architecture

- Service worker for offline access
- IndexedDB for local data cache
- Background sync for pending changes
- Photo caching for offline viewing

### Mobile-Friendly

- Responsive design (phone-first)
- Touch-optimized interface
- Quick-action buttons for common tasks

## Constraints

- Single-user accounts (no multi-user sharing initially)
- Minimal social features (no community, no comments)
- Photo storage limits based on Supabase plan

---

*This file is automatically updated by the `/capture` skill. Use category `spec` to add entries here.*
