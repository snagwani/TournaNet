# TournaNet

A district-level inter-school athletics tournament management system.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) |
| Backend | Node.js (Express/NestJS) |
| Database | PostgreSQL |
| AI Service | Python (RAG Pipeline) |
| Cloud | Azure |

## Project Structure

```
TournaNet/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Node.js backend
│   └── ai/           # Python AI service
├── docs/             # Documentation
└── ...
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Simulation & Sample Data
See the [Simulation Guide](./simulation/README.md) for instructions on seeding the database and running tournament scenarios.
```

## Scale

- ~50 schools
- ~200–250 athletes
- ~15–20 events
- Real-time scoring & public scoreboard
