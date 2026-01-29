# AGENTS.md - Muse Frame Development Guide

This file provides guidelines for AI agents working on the Muse Frame project.

## Project Overview

Muse Frame is an MVP web application for AI-generated personalized portraits. Users upload a photo, select an artistic style, pay via Stripe, and receive a high-quality AI-generated portrait.

- **Stack**: TanStack Start (React + Vite + SSR), TypeScript, Drizzle ORM, Stripe, Resend, Cloudflare R2
- **Working Directory**: `./muse-frame/`
- **PRD**: `tasks/prd-muse-frame.md`

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
just lint          # ESLint with @antfu/eslint-config
just format        # Format with oxfmt
just format_check  # Check formatting without applying
just check         # Run typecheck + lint + build

# Database
just db_generate   # Generate Drizzle migrations
just db_migrate    # Apply Drizzle migrations
just db_studio     # Open Drizzle Studio
```

**Package Manager**: Use `pnpm`:
```bash
pnpm install       # Install dependencies
pnpm add <package> # Add dependency
```

### Running Tests

No test framework configured. When adding tests:

```bash
# Install Vitest
pnpm add -D vitest

# Run single test file
vitest run filename.test.ts
```

## Code Style Guidelines

### Linter & Formatter

- **Linter**: ESLint with `@antfu/eslint-config`
- **Formatter**: oxfmt (orthogonal formatter)

**Key rules**:
- Single quotes only (`'string'`)
- No semicolons
- Sort imports alphabetically
- One expression per line in JSX

**Fix issues automatically**:
```bash
just format        # Apply formatting
pnpm lint --fix    # Apply lint fixes
```

### TypeScript

- Strict mode enabled - no implicit `any` types
- Explicit return types for exported functions
- Prefer interfaces for object shapes, types for unions

### Imports & Path Aliases

- Use path aliases: `~/...` maps to `./src/`
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

## Development Workflow

1. Read requirements in `tasks/prd-muse-frame.md`
2. Implement feature with acceptance criteria
3. Run `just check` before committing
4. Commit: `feat: [Story ID] - [Story Title]`
5. UI stories require browser verification

## Ralph Autonomous Agent Workflow

1. Read `scripts/ralph/prd.json` for stories with `passes: false`
2. Pick highest priority incomplete story
3. Implement the feature
4. Run `just check` to verify
5. Commit: `feat: [Story ID] - [Story Title]`
6. Update PRD `passes` field to `true`
7. Append progress to `scripts/ralph/progress.txt`

## Environment Variables

Create `.env` in `muse-frame/`:

```env
DATABASE_URL=file:./sqlite.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ACCOUNT_ID=...
```

## Common Tasks

**Add route**: Create `src/routes/[path].tsx` with `createFileRoute` - auto-routes

**Add API route**: Create server functions in `src/routes/api/`

**Schema changes**: `just db_generate && just db_migrate`

## Notes

- All acceptance criteria must include `Typecheck passes`
- UI stories require browser verification per PRD
