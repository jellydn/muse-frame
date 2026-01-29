# 7. Use BullMQ for Job Queue

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs async job processing for:
- AI portrait generation after payment
- Email sending after generation complete
- Scheduled cleanup of old uploads (daily)

Requirements:
- Reliable job execution with retries
- Job status tracking for UI updates
- Scheduled/cron jobs for cleanup
- Reasonable complexity for MVP

Options considered:
1. **BullMQ** - Redis-based, feature-rich
2. **Cloudflare Queues** - Serverless, Cloudflare ecosystem
3. **pg-boss** - PostgreSQL-based queues
4. **Custom polling** - Simple database polling

## Decision

Use **BullMQ** with Redis for job queue management.

Key reasons:
- Battle-tested, production-ready
- Built-in retries with exponential backoff
- Job progress tracking for UI updates
- Cron/scheduled job support
- Good TypeScript support

## Consequences

### Positive
- Reliable job processing with automatic retries
- Real-time job progress for confirmation page
- Scheduled jobs for daily cleanup
- Proven at scale

### Negative
- Requires Redis infrastructure
- Additional operational complexity
- Redis costs (Upstash for serverless option)
