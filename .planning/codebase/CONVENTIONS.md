# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- kebab-case for utilities and modules (`face-detection.ts`, `stripe-webhook.ts`)
- snake_case for database tables in schema (`orders`, `upload_path`)
- Route files match URL path (`upload.tsx`, `index.tsx`)

**Functions:**
- camelCase (`createCheckout`, `handleFileSelect`, `getStyleById`)
- Prefix with `handle` for event handlers (`handleDrop`, `handleContinue`)
- Prefix with `get` for data retrieval (`getStylesByCategory`)

**Variables:**
- camelCase (`uploadedFile`, `faceValidationStatus`)
- SCREAMING_SNAKE_CASE for constants (`MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES`)

**Types:**
- PascalCase for interfaces and types (`PortraitStyle`, `CreateCheckoutResult`)
- Suffix with `Result` for return types (`UploadPhotoResult`, `FaceDetectionResult`)
- Use `type` for unions, `interface` for object shapes

## Code Style

**Formatting:**
- Biome v1.9.4
- 2-space indentation
- 100 character line width
- Single quotes (`'string'`)
- No semicolons
- Bracket spacing enabled

**Linting:**
- Biome recommended rules
- Auto-organized imports (alphabetically sorted)
- Generated files ignored (`routeTree.gen.ts`)

## Import Organization

**Order:**
1. External libraries (`@tanstack/react-router`, `stripe`, `drizzle-orm`)
2. Path alias imports (`~/db`, `~/lib/env`, `~/lib/styles`)
3. Relative imports (not commonly used - prefer path aliases)

**Path Aliases:**
- `~/*` → `./src/*`

## Error Handling

**Patterns:**
- Guard clauses with early returns for validation
- Return result objects with `success` boolean + optional `error` string
- Try/catch in server functions with `console.error` logging
- Meaningful error messages for user feedback

```typescript
// Result pattern used throughout
interface Result {
  success: boolean
  data?: T
  error?: string
}

// Guard clause pattern
if (!file) return
if (file.size > MAX_FILE_SIZE) {
  return { success: false, error: 'File too large...' }
}
```

## Logging

**Framework:** console

**Patterns:**
- `console.error()` for errors in catch blocks
- `console.log()` for status updates in server functions
- No client-side logging except errors

## Comments

**When to Comment:**
- Placeholder/TODO comments for future implementation (`// TODO: Implement...`)
- Brief context for non-obvious code (rare)

**JSDoc/TSDoc:**
- Not used - types are self-documenting
- Prefer explicit TypeScript types over JSDoc

## Function Design

**Size:** Keep functions focused; extract helpers for complex logic

**Parameters:**
- Use explicit parameter types
- Prefer object parameters for 3+ arguments (not yet seen, but recommended)
- Return explicit result types for async operations

**Return Values:**
- Server functions return `Promise<ResultType>` with success/error pattern
- Helper functions return specific types or undefined

## Module Design

**Exports:**
- Named exports preferred (`export function`, `export const`, `export interface`)
- Default exports avoided except for route components

**Barrel Files:**
- Used for database (`~/db/index.ts` re-exports from schema)
- Not heavily used elsewhere

## Component Structure

**TanStack Router Pattern:**
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

**Server Functions:**
- Marked with `'use server'` directive at file top
- Live in `~/lib/server/` directory

## Database Patterns

**Drizzle ORM:**
- Schema defined in `~/db/schema.ts`
- Tables use snake_case columns
- Enum-like constants use `as const` pattern
- Timestamps stored as integer (unix epoch)

---

*Convention analysis: 2026-01-30*
