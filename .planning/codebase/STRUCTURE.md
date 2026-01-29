# Codebase Structure

**Analysis Date:** 2026-01-30

## Directory Layout

```
2026-01-29-muse-frame/
├── muse-frame/             # Main application
│   ├── src/
│   │   ├── db/             # Database layer
│   │   ├── lib/            # Shared libraries
│   │   │   └── server/     # Server-only functions
│   │   ├── routes/         # File-based routing
│   │   │   ├── api/        # API endpoints
│   │   │   └── order/      # Order routes
│   │   └── styles/         # CSS styles
│   └── public/             # Static assets
├── .planning/              # Planning documents
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── tasks/                  # Task/PRD files
```

## Directory Purposes

**muse-frame/src/routes/:**
- Purpose: File-based routing (TanStack Router)
- Contains: `.tsx` route components, `api/` server endpoints
- Key files: `__root.tsx`, `index.tsx`, `upload.tsx`

**muse-frame/src/lib/:**
- Purpose: Shared utilities and domain logic
- Contains: Client utils, server functions, type definitions
- Key files: `styles.ts`, `env.ts`, `face-detection.ts`

**muse-frame/src/lib/server/:**
- Purpose: Server-only functions (marked with `'use server'`)
- Contains: Database operations, external API calls
- Key files: `upload.ts`, `stripe.ts`, `orders.ts`

**muse-frame/src/db/:**
- Purpose: Database schema and connection
- Contains: Drizzle schema, db instance
- Key files: `schema.ts`, `index.ts`

**muse-frame/src/styles/:**
- Purpose: Global CSS styles
- Contains: CSS files
- Key files: `global.css`

## Key File Locations

**Entry Points:**
- `muse-frame/src/entry-client.tsx`: Client hydration
- `muse-frame/src/entry-server.tsx`: SSR handler
- `muse-frame/src/router.tsx`: Router configuration

**Configuration:**
- `muse-frame/app.config.ts`: TanStack Start config
- `muse-frame/vite.config.ts`: Vite bundler config
- `muse-frame/drizzle.config.json`: Drizzle migrations config
- `muse-frame/biome.json`: Linter/formatter config
- `muse-frame/tsconfig.json`: TypeScript config

**Core Logic:**
- `muse-frame/src/lib/server/stripe.ts`: Stripe checkout creation
- `muse-frame/src/lib/server/upload.ts`: R2 file uploads
- `muse-frame/src/routes/api/stripe-webhook.ts`: Payment webhooks

**Database:**
- `muse-frame/src/db/schema.ts`: Table definitions (orders)
- `muse-frame/src/db/index.ts`: Database connection

## Naming Conventions

**Files:**
- kebab-case: `face-detection.ts`, `stripe-webhook.ts`
- Route params: `$orderId` (dynamic segments)

**Directories:**
- kebab-case: `muse-frame/`, `.planning/`
- Route nesting: `order/$orderId/status.tsx`

**Components:**
- PascalCase functions: `IndexPage`, `UploadPage`
- Route exports: `export const Route = createFileRoute(...)`

**Database:**
- snake_case tables/columns: `orders`, `stripe_session_id`

## Where to Add New Code

**New Page:**
- Primary code: `muse-frame/src/routes/[path].tsx`
- Uses `createFileRoute()` for auto-routing

**New Server Function:**
- Implementation: `muse-frame/src/lib/server/[name].ts`
- Mark with `'use server'` at top

**New API Endpoint:**
- Implementation: `muse-frame/src/routes/api/[name].ts`

**New Database Table:**
- Schema: `muse-frame/src/db/schema.ts`
- Run: `just db_generate && just db_migrate`

**Shared Utilities:**
- Client-safe: `muse-frame/src/lib/[name].ts`
- Server-only: `muse-frame/src/lib/server/[name].ts`

## Special Directories

**muse-frame/.tanstack/:**
- Purpose: TanStack Start generated files
- Generated: Yes
- Committed: No (gitignored)

**muse-frame/dist/:**
- Purpose: Production build output
- Generated: Yes
- Committed: No

**muse-frame/node_modules/:**
- Purpose: Dependencies
- Generated: Yes
- Committed: No

**.planning/:**
- Purpose: Architecture and planning docs
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-01-30*
