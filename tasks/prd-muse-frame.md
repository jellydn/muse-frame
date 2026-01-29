# PRD: Muse Frame — AI Personalized Portraits

## Introduction

Muse Frame is an MVP web application that enables users to upload a photo, select an artistic style, pay, and receive a high-quality AI-generated portrait within minutes. The goal is to validate demand for AI-personalized portraits with minimal operational overhead, targeting gift buyers, casual users, and social media enthusiasts.

## Goals

- Launch a complete end-to-end flow: upload → style select → pay → generate → deliver
- Achieve ≥90% successful order delivery without manual intervention
- Target generation time < 5 minutes, total payment-to-delivery < 10 minutes
- Validate product-market fit before expanding features

## User Stories

### US-001: View Landing Page with Style Selection

**Description:** As a visitor, I want to see available portrait styles with previews so that I can choose one that fits my taste.

**Acceptance Criteria:**

- [ ] Landing page displays 3-5 curated styles with preview images
- [ ] Each style shows name, description, and fixed price
- [ ] Clicking a style navigates to the upload step
- [ ] Page loads in < 2 seconds
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Upload Photo with Validation

**Description:** As a user, I want to upload my photo and have it validated so that I know my image will work for portrait generation.

**Acceptance Criteria:**

- [ ] Accept JPEG/PNG files up to 10MB
- [ ] Validate single face is detected in the image
- [ ] Show clear error messages for invalid uploads (no face, multiple faces, wrong format, too large)
- [ ] Display image preview after successful upload
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Checkout with Stripe

**Description:** As a user, I want to pay securely via Stripe so that I can complete my order.

**Acceptance Criteria:**

- [ ] Redirect to Stripe Checkout with correct price
- [ ] No user account required (guest checkout)
- [ ] Handle successful payment → trigger generation
- [ ] Handle failed/cancelled payment → return to upload page
- [ ] Store order with status: pending → paid → generating → complete/failed
- [ ] Typecheck passes

### US-004: Generate Portrait with ComfyUI

**Description:** As a system, I need to generate the AI portrait using ComfyUI/Stable Diffusion so that users receive their artwork.

**Acceptance Criteria:**

- [ ] Queue generation job after successful payment
- [ ] Use predefined prompt template based on selected style
- [ ] Generate 1 high-resolution PNG (minimum 1024x1024)
- [ ] Complete generation within 5 minutes
- [ ] Store generated image in Cloudflare R2
- [ ] Update order status to complete/failed
- [ ] Typecheck passes

### US-005: Deliver Portrait via Email

**Description:** As a user, I want to receive my portrait via email so that I can download it easily.

**Acceptance Criteria:**

- [ ] Send email via Resend on generation complete
- [ ] Email contains secure download link
- [ ] Download link expires after 7 days
- [ ] Email includes order details and style name
- [ ] Typecheck passes

### US-006: Download Confirmation Page

**Description:** As a user, I want to see a confirmation page with my download link so that I can immediately access my portrait.

**Acceptance Criteria:**

- [ ] Display confirmation page after payment success
- [ ] Show generation progress/status
- [ ] Display download link when ready
- [ ] Allow 1 regeneration if user is unsatisfied
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Regenerate Portrait (Once)

**Description:** As a user, I want to regenerate my portrait once if unsatisfied so that I get a result I'm happy with.

**Acceptance Criteria:**

- [ ] Show "Regenerate" button on confirmation page (disabled after 1 use)
- [ ] Trigger new generation with same photo and style
- [ ] Update download link with new image
- [ ] Send new email with updated link
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Admin Dashboard - View Orders

**Description:** As an admin, I want to view all orders and their status so that I can monitor the system.

**Acceptance Criteria:**

- [ ] List all orders with: ID, status, style, created date, email
- [ ] Filter by status (pending, paid, generating, complete, failed)
- [ ] Show order count and success rate
- [ ] Protected by admin authentication
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Admin Dashboard - Retry Failed Generations

**Description:** As an admin, I want to retry failed generations so that customers receive their orders.

**Acceptance Criteria:**

- [ ] Show "Retry" button for failed orders
- [ ] Re-queue generation job
- [ ] Update status to generating
- [ ] Log retry attempts
- [ ] Typecheck passes

### US-010: Admin Dashboard - Manual Refund

**Description:** As an admin, I want to trigger manual refunds so that I can handle exceptional cases.

**Acceptance Criteria:**

- [ ] Show "Refund" button for paid/failed orders
- [ ] Call Stripe Refund API
- [ ] Update order status to refunded
- [ ] Log refund action with reason
- [ ] Typecheck passes

### US-011: Auto-Cleanup Uploaded Photos

**Description:** As a system, I need to delete uploaded photos after 7 days so that user privacy is maintained.

**Acceptance Criteria:**

- [ ] Scheduled job runs daily
- [ ] Delete original uploads older than 7 days from R2
- [ ] Log deletion count
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Landing page displays 3-5 portrait styles with static preview images and fixed pricing
- FR-2: Photo upload accepts JPEG/PNG up to 10MB with single-face validation
- FR-3: Stripe Checkout handles one-time payment with no account required
- FR-4: Background job queue processes AI generation asynchronously
- FR-5: ComfyUI/Stable Diffusion generates portraits using predefined style prompts
- FR-6: Generated images stored in Cloudflare R2 with signed URLs
- FR-7: Resend sends transactional emails for order confirmation and delivery
- FR-8: Download links expire after 7 days
- FR-9: Users can regenerate once per order
- FR-10: Admin dashboard shows orders, allows retry and manual refund
- FR-11: Uploaded photos auto-deleted after 7 days

## Non-Goals (Out of Scope)

- Physical prints or shipping
- User accounts/profiles
- Multi-face portraits
- Custom user prompts
- Mobile apps
- Localization/i18n
- Subscription pricing
- Social sharing features

## Design Considerations

- Clean, minimal UI focused on conversion
- Mobile-responsive design
- Clear photo upload guidelines with examples
- Progress indicators during generation
- Error states with helpful messaging

## Technical Considerations

### Stack

- **Framework:** TanStack Start (React + Vite + SSR)
- **Database:** SQLite (via Drizzle ORM) or Turso for edge
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Payments:** Stripe Checkout
- **AI Generation:** ComfyUI with Stable Diffusion 3.5 / FLUX (self-hosted) or Replicate (fallback)
- **Face Detection:** face-api.js or similar client-side library
- **Job Queue:** BullMQ with Redis, or Cloudflare Queues

### AI Generation

- **Platform:** Modal (serverless GPU, cost-effective for variable load)
- **Model:** Stable Diffusion 3.5 or FLUX via ComfyUI
- **Why Modal:** Lower cost than Replicate, pay only for compute time, scales to zero

### Architecture

```
[Landing] → [Upload] → [Stripe Checkout]
                              ↓
                        [Webhook Handler]
                              ↓
                        [Job Queue] → [ComfyUI Worker]
                              ↓
                        [R2 Storage] → [Email via Resend]
                              ↓
                        [Confirmation Page]
```

### Key Dependencies

- `@tanstack/start` - Full-stack React framework
- `drizzle-orm` - Database ORM
- `stripe` - Payment processing
- `resend` - Email delivery
- `@aws-sdk/client-s3` - R2 storage (S3-compatible)
- `bullmq` - Job queue (if using Redis)

## Success Metrics

- Conversion rate (visit → purchase) > 3%
- Average generation time < 3 minutes
- Regeneration rate < 15%
- Refund rate < 5%
- AI cost per portrait < 30% of price
- ≥90% orders delivered successfully

## Style Catalog

### For Girls

| Style    | Description                                | Price |
| -------- | ------------------------------------------ | ----- |
| Princess | Elegant royal portrait with crown and gown | $10   |
| Fantasy  | Magical fairy, elf, or enchanted character | $10   |

### For Boys

| Style       | Description                         | Price |
| ----------- | ----------------------------------- | ----- |
| Superheroes | Comic book hero transformation      | $10   |
| Fantasy     | Knight, wizard, or mythical warrior | $10   |

### Unisex

| Style                 | Description                                                              | Price |
| --------------------- | ------------------------------------------------------------------------ | ----- |
| National Culture      | Traditional costume from various cultures (Áo dài, Hanbok, Kimono, etc.) | $10   |
| Pre-school Graduation | Cap and gown graduation portrait for little ones                         | $10   |

## Photo Requirements

- **Resolution:** Clear photo (minimum 512x512, recommended 1024x1024+)
- **Lighting:** Natural lighting preferred
- **Face:** Single face, clearly visible, front-facing or slight angle
- **Format:** JPEG or PNG, max 10MB

## Open Questions

- None at this time
