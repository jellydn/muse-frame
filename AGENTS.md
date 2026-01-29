# AGENTS.md - Muse Frame Development Guide

This file provides guidelines for AI agents working on the Muse Frame project.

## Project Overview

Muse Frame is an MVP web application for AI-generated personalized portraits. Users upload a photo, select an artistic style, pay via Stripe, and receive a high-quality AI-generated portrait.

- **Stack**: TanStack Start (React + Vite + SSR), TypeScript, Drizzle ORM, Stripe, Resend, Cloudflare R2
- **Working Directory**: `./muse-frame/`
- **PRD**: `tasks/prd-muse-frame.md`

## Commands

All commands must run from the `muse-frame/` directory:

```bash
cd muse-frame

# Development
npm run dev           # Start dev server (port 3000)

# Build & Preview
npm run build         # Production build
npm run start         # Preview production build

# Quality Checks
npm run typecheck     # TypeScript type checking (REQUIRED before commits)
```

## Code Style Guidelines

### TypeScript

- Strict mode is enabled - no implicit `any` types
- Use explicit return types for functions exported from modules
- Prefer interfaces over type aliases for object shapes
- Use `zod` for runtime validation when needed (not currently installed)

### Imports & Path Aliases

- Use path aliases for local imports: `~/...` maps to `./src/`
- Prefer named imports over default imports
- Order imports: external libs → path aliases → relative imports

```typescript
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type User } from '~/types/user'
import { Component } from './component'
```

### Naming Conventions

- **Components/Routes**: PascalCase (e.g., `IndexPage`, `UploadPage`)
- **Variables/Functions**: camelCase (e.g., `isValid`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Files**: kebab-case for non-component files (e.g., `utils.ts`, `api-client.ts`)
- **Route files**: `*.tsx` files in `src/routes/` are auto-routed by TanStack Router

### Component Structure

Use named exports for route components following the established pattern:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  component: PageComponent,
})

function PageComponent() {
  return <div>...</div>
}
```

For root layout:

```typescript
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

### Error Handling

- Use guard clauses: return early for invalid states
- Throw errors with meaningful messages for unexpected conditions
- Handle async operations with try/catch in server actions
- Display user-friendly error messages in UI components

```typescript
if (!file) return
if (file.size > MAX_SIZE) {
  throw new Error('File too large')
}
```

### React Best Practices

- Use functional components with hooks
- Destructure props for clarity
- Keep components small and focused
- Use TanStack Query for server state (via `@tanstack/react-router`)

### Database (Drizzle ORM)

- Define schemas in `~/db/` directory (create if needed)
- Use TypeScript types inferred from schemas
- Run migrations before commits if schema changes

## Development Workflow

1. **Read Requirements**: Check `tasks/prd-muse-frame.md` for user stories and acceptance criteria
2. **Typecheck First**: Run `npm run typecheck` before committing
3. **Follow Patterns**: Match existing code in `src/routes/` and `src/`
4. **Browser Testing**: Use dev tools to verify UI changes work correctly
5. **Update CLAUDE.md**: Document reusable patterns when discovered

## Testing

No test framework is currently configured. When adding tests:

- Use Vitest for unit tests (matches Vite ecosystem)
- Place tests alongside source files: `*.test.ts` or `*.spec.ts`
- Run tests with: `npm test` (once configured)

## Ralph Autonomous Agent Workflow

For autonomous agents using `scripts/ralph/CLAUDE.md`:

1. Read `scripts/ralph/prd.json` for user stories with `passes: false`
2. Pick highest priority incomplete story
3. Implement the feature
4. Run `npm run typecheck` to verify
5. Commit with message: `feat: [Story ID] - [Story Title]`
6. Update PRD `passes` field to `true`
7. Append progress to `scripts/ralph/progress.txt`

## File Locations

```
muse-frame/
├── src/
│   ├── routes/          # File-based routes (TanStack Router)
│   ├── router.tsx       # Router configuration
│   ├── entry-client.tsx # Client entry point
│   └── entry-server.tsx # Server entry point
├── app.config.ts        # TanStack Start config
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config
└── package.json
```

## Environment Variables

Create `.env` file for local development (DO NOT commit secrets):

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# AWS/R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ACCOUNT_ID=...

# Database
DATABASE_URL=file:./sqlite.db
```

## Common Tasks

### Adding a New Route

1. Create `src/routes/[path].tsx` with `createFileRoute`
2. Component auto-renders at `/path`
3. Run `npm run dev` - routes auto-generated

### Adding API Routes

TanStack Start uses file-based API routes. Create server functions in `src/routes/api/` (create directory if needed).

### Database Schema Changes

1. Create migration in `~/db/migrations/` (create directories if needed)
2. Apply migration: `npx drizzle-kit migrate`
3. Typecheck passes

## Notes

- No ESLint/Prettier/Biome configured - code formatting is manual
- Consider adding Biome for linting and formatting
- All acceptance criteria must include `Typecheck passes`
- UI stories require browser verification per PRD
