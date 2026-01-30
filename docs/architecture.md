# TournaNet Architecture

## System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│   API       │────▶│ PostgreSQL  │
│  (Next.js)  │◀────│  (Node.js)  │◀────│             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          │ REST
                          ▼
                   ┌─────────────┐
                   │ AI Service  │
                   │  (Python)   │
                   └─────────────┘
```

## Data Flow

1. **Web → API** — All user actions go through the backend
2. **API → DB** — Transactional operations with PostgreSQL
3. **API ↔ AI** — API calls AI for insights; AI never writes to DB directly
4. **API → Web** — WebSocket pushes real-time score updates

## Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Full CRUD, tournament config, user management |
| Scorer | Update scores for assigned events |
| Public | Read-only access to scoreboard |

## Key Principles

- **Strong consistency** — PostgreSQL transactions for all mutations
- **Real-time** — WebSockets for live scoring updates
- **AI is advisory** — Suggestions require human approval
