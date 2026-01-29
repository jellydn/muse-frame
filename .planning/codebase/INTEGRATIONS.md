# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Payments:**
- Stripe - Checkout sessions and payment processing
- SDK/Client: `stripe` npm package
- Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**File Storage:**
- Cloudflare R2 - Image upload and storage
- SDK/Client: `@aws-sdk/client-s3` (S3-compatible API)
- Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Config: `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_PUBLIC_URL`

**Email:**
- Resend - Transactional email (configured but not yet implemented)
- SDK/Client: `resend` npm package
- Auth: `RESEND_API_KEY`

**AI Generation:**
- Modal - Serverless AI image generation (placeholder, not implemented)
- SDK/Client: Direct API calls (planned)
- Auth: `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`

**Client-Side:**
- face-api.js - Browser-based face detection for photo validation

## Data Storage

**Databases:**
- SQLite via better-sqlite3
- Connection: `DATABASE_URL` (defaults to `file:./sqlite.db`)
- Client: Drizzle ORM

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
- Upload path pattern: `uploads/{styleId}/{uuid}.{ext}`
- Output path pattern: `generated/{orderId}/output.png`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None (email-based order identification only)
- Implementation: Customer email collected at checkout

## Monitoring & Observability

**Error Tracking:**
- None (console.error logging only)

**Logs:**
- Console logging for webhook events and errors

## CI/CD & Deployment

**Hosting:**
- Node.js server (TanStack Start node-server preset)

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- `AWS_ACCESS_KEY_ID` - R2 access key
- `AWS_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_PUBLIC_URL` - Public URL for R2 assets
- `RESEND_API_KEY` - Resend email API key
- `MODAL_TOKEN_ID` - Modal authentication
- `MODAL_TOKEN_SECRET` - Modal authentication

**Optional env vars:**
- `DATABASE_URL` - SQLite path (defaults to `file:./sqlite.db`)

**Secrets location:**
- Environment variables (no .env file present, configured in deployment platform)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/stripe-webhook` - Stripe checkout completion events

**Outgoing:**
- None

---

*Integration audit: 2026-01-30*
