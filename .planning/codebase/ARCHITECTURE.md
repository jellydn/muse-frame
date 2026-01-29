# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Full-stack Monolithic SSR Application (TanStack Start)

**Key Characteristics:**
- File-based routing with server-side rendering
- Server functions with `'use server'` directive for backend logic
- SQLite database with Drizzle ORM for persistence
- External integrations: Stripe (payments), Cloudflare R2 (storage), Resend (email)

## Layers

**Presentation Layer (Routes):**
- Purpose: Render UI and handle user interactions
- Location: `muse-frame/src/routes/`
- Contains: React components, loaders, page state
- Depends on: lib (client + server), styles
- Used by: Router (entry points)

**Server Functions Layer:**
- Purpose: Execute backend logic in response to client calls
- Location: `muse-frame/src/lib/server/`
- Contains: `'use server'` functions for upload, checkout, orders
- Depends on: db, env, external services (Stripe, S3/R2)
- Used by: Route components via RPC

**Data Access Layer:**
- Purpose: Database operations and schema definition
- Location: `muse-frame/src/db/`
- Contains: Drizzle schema, database connection
- Depends on: better-sqlite3, env
- Used by: Server functions

**Shared Library Layer:**
- Purpose: Shared utilities and domain logic
- Location: `muse-frame/src/lib/`
- Contains: styles.ts (domain data), face-detection.ts (client), env.ts
- Depends on: External libs (face-api.js)
- Used by: Routes, server functions

## Data Flow

**Photo Upload & Checkout:**
1. User selects style → navigates to `/upload?style={id}`
2. User uploads photo → client-side face detection validates single face
3. User enters email → clicks "Continue to Payment"
4. `uploadPhoto()` server function → uploads to R2, returns `uploadPath`
5. `createCheckout()` server function → creates order (pending), creates Stripe session
6. User redirected to Stripe Checkout

**Payment & Generation:**
1. Stripe Checkout completed → webhook hits `/api/stripe-webhook`
2. Webhook verifies signature → updates order to `paid`
3. Generation job triggered (placeholder) → status becomes `generating`
4. Generation completes → status becomes `complete`, `outputPath` set
5. User polls `/order/$orderId/status` for updates (auto-refresh every 5s)

**State Management:**
- Component-local state via React `useState`/`useEffect`
- Server state via route loaders (`loader` function)
- Database is source of truth for order state

## Key Abstractions

**PortraitStyle:**
- Purpose: Defines available portrait styles with pricing and prompts
- Examples: `muse-frame/src/lib/styles.ts`
- Pattern: Static data array with lookup functions

**Order:**
- Purpose: Tracks user order lifecycle from pending → complete
- Examples: `muse-frame/src/db/schema.ts`
- Pattern: State machine (pending → paid → generating → complete/failed)

**Server Functions:**
- Purpose: RPC-style backend calls from client components
- Examples: `upload.ts`, `stripe.ts`, `orders.ts`
- Pattern: `'use server'` directive, return typed result objects

## Entry Points

**Client Entry:**
- Location: `muse-frame/src/entry-client.tsx`
- Triggers: Browser hydration
- Responsibilities: Hydrate React app with TanStack StartClient

**Server Entry:**
- Location: `muse-frame/src/entry-server.tsx`
- Triggers: HTTP requests
- Responsibilities: SSR rendering, request handling

**API Webhook:**
- Location: `muse-frame/src/routes/api/stripe-webhook.ts`
- Triggers: Stripe POST webhooks
- Responsibilities: Payment confirmation, order status updates

**Router:**
- Location: `muse-frame/src/router.tsx`
- Triggers: Navigation
- Responsibilities: Route matching, scroll restoration

## Error Handling

**Strategy:** Guard clauses with early returns, typed result objects

**Patterns:**
- Server functions return `{ success: boolean, error?: string }` objects
- Route loaders throw errors → caught by `errorComponent`
- Try/catch blocks for external service calls (Stripe, S3)
- Console logging for debugging

## Cross-Cutting Concerns

**Logging:** Console-based (`console.log`, `console.error`)

**Validation:**
- Client: File type/size validation, email regex, face detection
- Server: Duplicated validation in server functions

**Authentication:** None (email-based order tracking, no user accounts)

**Environment:** Centralized in `muse-frame/src/lib/env.ts`

---

*Architecture analysis: 2026-01-30*
