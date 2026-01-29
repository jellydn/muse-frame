# AGENTS.md - Muse Frame Development Guide

This file provides guidelines for AI agents working on the Muse Frame project.

## Project Overview

Muse Frame is an MVP web application for AI-generated personalized portraits. Users upload a photo, select an artistic style, pay via Stripe, and receive a high-quality AI-generated portrait.

- **Stack**: TanStack Start (React + Vite + SSR), TypeScript, Drizzle ORM, Stripe, Resend, Cloudflare R2
- **Working Directory**: `./muse-frame/`
- **Package Manager**: pnpm
- **Database**: SQLite (drizzle-orm)
- **Storage**: Cloudflare R2 (AWS S3-compatible)
- **Email**: Resend

## Commands

All commands run from `muse-frame/` directory using `just`:

```bash
# Development
just dev           # Start dev server (port 3000)

# Build & Preview
just build         # Production build
just start         # Preview production build

# Quality Checks
just typecheck     # TypeScript type checking (REQUIRED)
just lint          # Biome linter
just format        # Format with Biome
just format_check  # Check formatting without applying
just check         # Run typecheck + lint + build

# Database
just db_generate   # Generate Drizzle migrations
just db_migrate    # Apply Drizzle migrations
just db_studio     # Open Drizzle Studio

# Testing
just test          # Run Playwright E2E tests
```

**Package Manager**: Use `pnpm`:
```bash
pnpm install       # Install dependencies
pnpm add <package> # Add dependency
pnpm add -D <dev-package> # Add dev dependency
```

### Running Tests

**Playwright** is installed for E2E tests:
```bash
# Run all tests
pnpm playwright test

# Run single test file
pnpm playwright test path/to/test.spec.ts

# Run with UI
pnpm playwright test --ui
```

**For unit tests**, install Vitest:
```bash
pnpm add -D vitest
vitest run filename.test.ts
```

## Code Style Guidelines

### Linter & Formatter

**Biome** is configured with the following rules:

- **Single quotes** only (`'string'`)
- **Semicolons**: as needed (let Biome decide)
- **2-space indentation**
- **100 character line width**
- **Sort imports alphabetically**

**Fix issues automatically**:
```bash
just format        # Apply formatting
just lint          # Apply lint fixes
pnpm lint --fix    # Apply lint fixes
```

### TypeScript

- Strict mode enabled - no implicit `any` types
- Explicit return types for exported functions
- Prefer interfaces for object shapes, types for unions
- Use `~/*` path aliases for imports from `./src/`

### Imports & Path Aliases

- Use path aliases: `~/*` maps to `./src/`
- Named imports over default imports
- Order: external libraries → path aliases → relative imports

```typescript
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { formatDate } from '~/lib/utils'
import { users } from './users'
```

### JSX Guidelines

- One expression per line
- Self-closing tags for elements without children
- Use parentheses for multi-line JSX

```tsx
return (
  <div className="container">
    {isLoading ? (
      <Spinner />
    ) : (
      <Content data={data} />
    )}
  </div>
)
```

### Naming Conventions

- **Components/Routes**: PascalCase (`IndexPage`, `UploadPage`)
- **Variables/Functions**: camelCase (`isValid`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Files**: kebab-case (`utils.ts`, `api-client.ts`)
- **Database tables**: snake_case (`orders`, `users`)
- **Database columns**: snake_case (`created_at`, `user_id`)

### Component Structure

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  component: PageComponent,
})

function PageComponent() {
  return <div>...</div>
}
```

### Error Handling

- Guard clauses: return early for invalid states
- Throw errors with meaningful messages
- Try/catch in server actions

```typescript
if (!file) return
if (file.size > MAX_FILE_SIZE) {
  throw new Error(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`)
}
```

## Database (Drizzle ORM)

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed'] }).notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))
```

## Common Tasks

**Add route**: Create `src/routes/[path].tsx` with `createFileRoute` - auto-routes

**Add API route**: Create server functions in `src/routes/api/`

**Schema changes**: `just db_generate && just db_migrate`

**Add new table**:
1. Define schema in `src/db/schema.ts`
2. Run `just db_generate`
3. Run `just db_migrate`

## Environment Setup

Required environment variables (create `.env`):

```env
# Database
DATABASE_URL=./sqlite.db

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# Cloudflare R2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=muse-frame
R2_PUBLIC_URL=https://...
```

## Project Structure

```
src/
├── db/
│   ├── schema.ts      # Database schema definitions
│   └── index.ts       # Database connection & queries
├── lib/
│   ├── utils.ts       # Shared utility functions
│   └── api.ts         # API client functions
├── routes/
│   ├── __root.tsx     # Root layout
│   ├── index.tsx      # Home page (/)
│   ├── upload.tsx     # Upload page (/upload)
│   └── _layout.tsx    # Shared layout
├── router.tsx         # Router configuration
├── entry-client.tsx   # Client entry point
├── entry-server.tsx   # Server entry point
└── styles/            # CSS styles
```

## Notes

- Run `just check` before committing changes
- All acceptance criteria must include `Typecheck passes`
- UI stories require browser verification per PRD
- Use `just db_studio` to inspect database during development
- Never commit `.env` files or secrets
