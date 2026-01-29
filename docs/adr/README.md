# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Muse Frame project.

## What are ADRs?

ADRs capture important architectural decisions made during project development. They help:

- Record the context and reasoning behind decisions
- Track the evolution of architectural choices
- Onboard new team members
- Avoid revisiting already-settled decisions

## ADR Index

| Number | Title | Status | Date |
|--------|-------|--------|------|
| 0001 | [Use TanStack Start with React](0001-use-tanstack-start-with-react.md) | Accepted | 2026-01-30 |
| 0002 | [Use Drizzle ORM with SQLite](0002-use-drizzle-orm-with-sqlite.md) | Accepted | 2026-01-30 |
| 0003 | [Use Cloudflare R2 for Storage](0003-use-cloudflare-r2-for-storage.md) | Accepted | 2026-01-30 |
| 0004 | [Use Stripe Checkout for Payments](0004-use-stripe-checkout-for-payments.md) | Accepted | 2026-01-30 |
| 0005 | [Use Modal for AI Generation](0005-use-modal-for-ai-generation.md) | Accepted | 2026-01-30 |
| 0006 | [Use Resend for Email](0006-use-resend-for-email.md) | Accepted | 2026-01-30 |
| 0007 | [Use BullMQ for Job Queue](0007-use-bullmq-for-job-queue.md) | Accepted | 2026-01-30 |
| 0008 | [Use Biome for Linting and Formatting](0008-use-biome-for-linting-and-formatting.md) | Accepted | 2026-01-30 |

## Creating New ADRs

Use the format: `NNNN-title-with-dashes.md`

Each ADR should include:
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: The situation requiring a decision
- **Decision**: The chosen solution
- **Consequences**: Positive and negative outcomes
