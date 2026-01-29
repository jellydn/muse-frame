# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- TypeScript 5.6.3 - All application code (frontend, backend, config)

**Secondary:**
- JavaScript/JSX - React components via `react-jsx` transpilation

## Runtime

**Environment:**
- Node.js (ES2022 target)

**Package Manager:**
- pnpm (workspace-enabled)
- Lockfile: present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- TanStack Start 1.114.0 - Full-stack React framework with SSR
- TanStack Router 1.114.0 - File-based routing
- React 18.3.1 - UI library
- Vite 7.0.0 - Build tool and dev server

**Database:**
- Drizzle ORM 0.45.1 - Type-safe SQL ORM
- better-sqlite3 12.6.2 - SQLite driver

**Testing:**
- Playwright 1.58.0 - E2E testing (installed, no test config)

**Build/Dev:**
- Biome 1.9.4 - Linter and formatter
- vite-tsconfig-paths 5.1.3 - Path alias resolution
- @vitejs/plugin-react 4.3.4 - React plugin for Vite

## Key Dependencies

**Critical:**
- stripe 20.3.0 - Payment processing
- @aws-sdk/client-s3 3.978.0 - Cloudflare R2 file uploads
- resend 6.9.1 - Transactional email (imported but not yet used)
- face-api.js 0.22.2 - Client-side face detection

**Infrastructure:**
- uuid 13.0.0 - Unique ID generation
- drizzle-kit 0.31.8 - Database migrations

## Configuration

**Environment:**
- `src/lib/env.ts` centralizes all environment variables
- 11 env vars required (Stripe, R2, Resend, Modal)

**Build:**
- `vite.config.ts` - Vite + TanStack Start plugins
- `app.config.ts` - TanStack Start app config (node-server preset)
- `tsconfig.json` - Strict mode, ES2022, path aliases (`~/`)
- `biome.json` - Single quotes, no semicolons, import sorting
- `drizzle.config.json` - SQLite dialect, schema location

## Platform Requirements

**Development:**
- Node.js (ES2022 compatible)
- pnpm
- just (task runner)

**Production:**
- Node.js server (node-server preset)
- SQLite database file
- Cloudflare R2 for file storage

---

*Stack analysis: 2026-01-30*
