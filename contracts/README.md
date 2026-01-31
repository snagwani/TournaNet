# TournaNet API Contracts

This directory contains OpenAPI specifications that serve as the **single source of truth** for all API contracts in TournaNet.

## Contract-First Development

We use a **contract-first** approach where:

1. **API shape is defined first** — Before writing any implementation code
2. **Backend and frontend agree on the contract** — Prevents mismatches
3. **Validation rules are explicit** — Documented in the spec, not hidden in code
4. **Types are generated from the spec** — Ensures consistency

## Directory Structure

```
contracts/
├── openapi.yaml          # Main spec with shared components
└── components/
    └── schools.yaml      # School registration endpoint
```

## How Teams Consume This Contract

### Backend (NestJS)

The backend will use tools to generate:
- **DTOs** with class-validator decorators matching spec validation rules
- **Response types** for type-safe controller returns
- **Swagger documentation** from the OpenAPI spec

```bash
# Future: Generate backend types
npx openapi-generator-cli generate -i contracts/openapi.yaml -g typescript-nestjs ...
```

### Frontend (Next.js)

The frontend will generate:
- **TypeScript types** for request/response payloads
- **API client** with fully typed methods

```bash
# Future: Generate frontend client
npx openapi-typescript contracts/openapi.yaml -o apps/web/src/types/api.d.ts
```

## Validation Rules Summary

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✓ | 1-200 chars |
| `district` | string | ✓ | 1-200 chars |
| `contactName` | string | ✓ | 1-100 chars |
| `contactEmail` | string | ✓ | Valid email, max 255 chars |
| `contactPhone` | string | ✗ | Max 20 chars, phone pattern |

## Commands

```bash
# Validate the spec (requires spectral CLI)
npx @stoplight/spectral-cli lint contracts/openapi.yaml

# Preview in Swagger UI (requires swagger-ui)
npx @redocly/cli preview-docs contracts/openapi.yaml
```
