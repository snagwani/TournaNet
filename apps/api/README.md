# TournaNet API

Node.js backend service.

## Architecture

```
src/
├── controllers/    # HTTP handlers
├── services/       # Business logic
├── repositories/   # Database access
├── entities/       # Data models
├── middleware/     # Auth, validation
└── websockets/     # Real-time events
```

## Key Responsibilities

- RESTful API for tournament operations
- WebSocket server for real-time scoring
- Role-based access control (RBAC)
- PostgreSQL data management

## Development

```bash
pnpm dev
```
