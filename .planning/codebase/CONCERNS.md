# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**Simulated AI Generation:**
- Issue: AI generation is simulated with `setTimeout` instead of real Modal integration
- Files: `muse-frame/src/routes/api/stripe-webhook.ts:84-142`
- Impact: Orders mark as complete without actual portrait generation
- Fix approach: Implement Modal serverless function integration (tracked as US-012, US-013)

**Hardcoded Redirect URLs:**
- Issue: Stripe checkout uses `R2_PUBLIC_URL` for success/cancel URLs which is incorrect
- Files: `muse-frame/src/lib/server/stripe.ts:84-85`
- Impact: Users redirected to wrong domain after payment
- Fix approach: Add proper `APP_URL` environment variable for application URLs

**Environment Validation Missing:**
- Issue: Env vars default to empty strings, no runtime validation
- Files: `muse-frame/src/lib/env.ts`
- Impact: App runs but silently fails when env vars missing
- Fix approach: Add Zod schema validation with required checks

## Known Bugs

**setTimeout in Webhook Not Awaited:**
- Symptoms: Generation job may not complete if server restarts
- Files: `muse-frame/src/routes/api/stripe-webhook.ts:91-110`
- Trigger: Any order payment completion
- Workaround: None - orders may get stuck in 'paid' status

**Status Page Auto-Refresh Uses Full Page Reload:**
- Symptoms: Poor UX, flashing page every 5 seconds
- Files: `muse-frame/src/routes/order/$orderId/status.tsx:55-57`
- Trigger: View order status during 'paid' or 'generating' state
- Workaround: None - consider polling API instead

## Security Considerations

**Order Access Without Authentication:**
- Risk: Anyone can view any order by guessing order ID (sequential integers)
- Files: `muse-frame/src/lib/server/orders.ts`, `muse-frame/src/routes/order/$orderId/status.tsx`
- Current mitigation: None
- Recommendations: Add secure token/UUID for order access, or email-based verification

**No Rate Limiting:**
- Risk: Abuse via repeated uploads, checkout attempts, or webhook flooding
- Files: All API routes
- Current mitigation: None
- Recommendations: Add rate limiting middleware

**Email Enumeration:**
- Risk: Order lookup could expose if email exists in system
- Files: Order retrieval uses sequential IDs
- Current mitigation: No email-based lookup exposed yet
- Recommendations: Keep order lookup by ID only, add access tokens

**Uploaded Files Not Scanned:**
- Risk: Malicious files could be uploaded (though validated client-side)
- Files: `muse-frame/src/lib/server/upload.ts`
- Current mitigation: MIME type validation on server
- Recommendations: Add antivirus scanning, content-type verification from file bytes

## Performance Bottlenecks

**Client-Side Face Detection:**
- Problem: Downloads ~6MB face-api.js models on every page load
- Files: `muse-frame/src/lib/face-detection.ts`
- Cause: Models loaded from `/models` endpoint on demand
- Improvement path: Move to server-side detection, or lazy-load after file selection

**Full Page Reload for Status Polling:**
- Problem: Reloads entire page every 5s during generation
- Files: `muse-frame/src/routes/order/$orderId/status.tsx:55-57`
- Cause: Uses `window.location.reload()` instead of API polling
- Improvement path: Implement API endpoint for status, use React Query/SWR

**Large Upload Page Component:**
- Problem: 363 lines in single component with mixed concerns
- Files: `muse-frame/src/routes/upload.tsx`
- Cause: All state, validation, and UI in one file
- Improvement path: Extract hooks, separate form validation, split UI components

## Fragile Areas

**Stripe Webhook Handler:**
- Files: `muse-frame/src/routes/api/stripe-webhook.ts`
- Why fragile: Mixes webhook verification, order updates, and async job triggering
- Safe modification: Test with Stripe CLI locally, add unit tests for each handler
- Test coverage: None - no test files exist

**Order Status State Machine:**
- Files: `muse-frame/src/db/schema.ts`, `muse-frame/src/routes/api/stripe-webhook.ts`
- Why fragile: Status transitions spread across webhook, no central state machine
- Safe modification: Document valid transitions, add validation before updates
- Test coverage: None

## Scaling Limits

**SQLite Database:**
- Current capacity: Suitable for MVP/prototype
- Limit: Concurrent writes, single-server deployment
- Scaling path: Migrate to PostgreSQL, Turso, or PlanetScale

**Synchronous Generation Simulation:**
- Current capacity: One order at a time in memory
- Limit: Server restart loses all pending generations
- Scaling path: Use proper job queue (BullMQ, Modal queue)

**Single R2 Bucket:**
- Current capacity: Adequate for MVP
- Limit: No CDN for output delivery
- Scaling path: Add Cloudflare CDN in front of R2

## Dependencies at Risk

**face-api.js:**
- Risk: Last updated 4+ years ago, no active maintenance
- Impact: Browser compatibility issues, security vulnerabilities
- Migration plan: Switch to @mediapipe/face_detection or TensorFlow.js

**@tanstack/react-start:**
- Risk: Very new framework, API may change
- Impact: Breaking changes on updates
- Migration plan: Pin versions, review changelogs carefully

## Missing Critical Features

**Email Notifications:**
- Problem: Resend API key configured but no email sending implemented
- Blocks: Users don't receive order confirmation or download links

**Download API Endpoint:**
- Problem: Status page links to `/api/download/${orderId}` which doesn't exist
- Blocks: Users cannot download completed portraits

**Error Recovery:**
- Problem: No retry mechanism for failed generations
- Blocks: Failed orders require manual intervention

**Admin Dashboard:**
- Problem: No way to view/manage orders
- Blocks: Operations, customer support

## Test Coverage Gaps

**No Tests Exist:**
- What's not tested: Entire application (0 test files found)
- Files: All source files
- Risk: Regressions undetected, refactoring dangerous
- Priority: High

**Critical Untested Paths:**
- Stripe webhook signature verification
- Payment flow end-to-end
- Order status transitions
- File upload validation
- Face detection edge cases
- Priority: High

---

*Concerns audit: 2026-01-30*
