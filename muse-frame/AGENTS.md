# AGENTS.md - Muse Frame Development Guide

This file provides guidelines for AI agents working on the Muse Frame project.

## Project Overview

Muse Frame is an MVP web application for AI-generated personalized portraits. Users upload a photo, select an artistic style, pay via Stripe, and receive a high-quality AI-generated portrait.

- **Stack**: TanStack Start (React + Vite + SSR), TypeScript, Drizzle ORM, Stripe, Resend, Cloudflare R2
- **Working Directory**: `./muse-frame/`
- **Package Manager**: pnpm

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
```

## Code Style Guidelines

### Linter & Formatter

**Biome** is configured with the following rules:

- **Single quotes** only (`'string'`)
- **No semicolons**
- **2-space indentation**
- **100 character line width**

**Fix issues automatically**:
```bash
just format        # Apply formatting
just lint          # Apply lint fixes
```

### TypeScript

- Strict mode enabled - no implicit `any` types
- Explicit return types for exported functions
- Prefer interfaces for object shapes, types for unions

### Imports & Path Aliases

- Use path aliases: `~/*` maps to `./src/`
- Named imports over default imports
- Order: external libs → path aliases → relative imports

### Naming Conventions

- **Components/Routes**: PascalCase (`IndexPage`, `UploadPage`)
- **Variables/Functions**: camelCase (`isValid`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Files**: kebab-case (`utils.ts`, `api-client.ts`)
- **Database tables**: snake_case (`orders`, `users`)

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

### Database (Drizzle ORM)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
})
```

## Common Tasks

**Add route**: Create `src/routes/[path].tsx` with `createFileRoute` - auto-routes

**Add API route**: Create server functions in `src/routes/api/`

**Schema changes**: `just db_generate && just db_migrate`

## Notes

- Run `just check` before committing changes
- All acceptance criteria must include `Typecheck passes`
- UI stories require browser verification per PRD
