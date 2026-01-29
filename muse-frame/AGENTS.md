# AGENTS.md - Muse Frame Development Guide

This file provides guidelines for AI agents working on the Muse Frame project.

## Project Overview

Muse Frame is an MVP web application for AI-generated personalized portraits. Users upload a photo, select an artistic style, pay via Stripe, and receive a high-quality AI-generated portrait.

- **Stack**: TanStack Start (React + Vite + SSR), TypeScript, Drizzle ORM, Stripe, Resend, Cloudflare R2
- **Working Directory**: `./muse-frame/`
- **Package Manager**: pnpm
- **Database**: SQLite (drizzle-orm)
- **PRD**: `tasks/prd-muse-frame.md`

## Commands

All commands run from `muse-frame/` directory using `pnpm`:

```bash
# Development
pnpm dev           # Start dev server (port 3000)

# Build & Preview
pnpm build         # Production build
pnpm start         # Preview production build

# Quality Checks
pnpm typecheck     # TypeScript type checking (REQUIRED)
pnpm lint          # Biome linter
pnpm format        # Apply Biome formatting
pnpm format_check  # Check formatting without applying
pnpm check         # Run typecheck + lint + build

# Database
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Apply Drizzle migrations
pnpm db:studio     # Open Drizzle Studio

# Testing (Vitest)
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

**Package Manager Commands**:
```bash
pnpm install       # Install dependencies
pnpm add <package> # Add dependency
```

## Code Style Guidelines

### Linter & Formatter

- **Tool**: Biome v1.9.4
- **Configuration** (`biome.json`):
  - Single quotes only (`'string'`)
  - Semicolons: as needed
  - 2-space indentation
  - 100 character line width
  - Bracket spacing enabled

**Fix issues automatically**:
```bash
pnpm format        # Apply formatting
pnpm lint          # Biome check (use --apply to fix)
```

### TypeScript

- Strict mode enabled - no implicit `any` types
- Explicit return types for exported functions
- Prefer `interface` for object shapes, `type` for unions

### Imports & Path Aliases

- Use `~/*` path aliases (maps to `./src/`)
- Named imports over default imports
- **Order**: external libs → path aliases → relative imports

```typescript
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { formatDate } from '~/lib/utils'
import { users } from './users'
```

### Naming Conventions

- **Components/Routes**: PascalCase (`IndexPage`, `UploadPage`)
- **Variables/Functions**: camelCase (`isValid`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES`)
- **Files**: kebab-case (`utils.ts`, `api-client.ts`, `stripe-webhook.ts`)
- **Database tables/columns**: snake_case (`orders`, `created_at`)
- **Types/Interfaces**: PascalCase (`PortraitStyle`, `CreateCheckoutResult`)

**Function prefixes**:
- `handle*` for event handlers (`handleDrop`, `handleContinue`)
- `get*` for data retrieval (`getStylesByCategory`)

### JSX

- One expression per line
- Self-closing tags for elements without children
- Use parentheses for multi-line JSX

## Component Pattern

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  component: PageComponent,
})

function PageComponent() {
  // hooks at top
  // handlers next
  // render
  return <div>...</div>
}
```

## Error Handling

**Guard clauses**: Return early for invalid states.

**Result pattern** (common in server functions):
```typescript
interface Result<T> {
  success: boolean
  data?: T
  error?: string
}

if (!file) return
if (file.size > MAX_FILE_SIZE) {
  throw new Error(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`)
}
```

**Server functions**: Use try/catch with `console.error` logging.

```typescript
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: 'Failed to process' }
}
```

## Database (Drizzle ORM)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

## Common Tasks

**Add route**: Create `src/routes/[path].tsx` with `createFileRoute` - auto-routes

**Add API route**: Create server functions in `~/lib/server/`, marked with `'use server'`

**Schema changes**: `pnpm db:generate && pnpm db:migrate`

**Add new table**:
1. Define schema in `~/db/schema.ts`
2. Run migrations

## Notes

- Run `pnpm check` before committing
- All acceptance criteria must include `Typecheck passes`
- Never commit `.env` files or secrets
