# TournaNet API

NestJS backend for tournament management.

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: class-validator + ValidationPipe
- **Logging**: Structured JSON (prod) / Pretty (dev)

## Project Structure

```
src/
├── main.ts                 # Bootstrap with global pipes/filters
├── app.module.ts           # Root module
├── config/                 # Environment configuration
├── common/
│   ├── filters/            # Exception filters
│   ├── logger/             # Structured logging
│   └── prisma/             # Database client
└── health/                 # Health check endpoint
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check with DB status |

## Environment Variables

See `.env.example` for required configuration.
