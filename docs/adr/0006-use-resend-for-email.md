# 6. Use Resend for Email Delivery

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs transactional email for:
- Order confirmation after payment
- Portrait delivery with download link
- Regeneration notifications

Requirements:
- Reliable delivery
- Simple API integration
- React-based email templates (matches stack)
- Reasonable pricing for MVP volume

Options considered:
1. **Resend** - Modern API, React email support
2. **SendGrid** - Established provider
3. **Postmark** - Transactional email specialist
4. **AWS SES** - Low cost, more setup

## Decision

Use **Resend** for all transactional emails.

Key reasons:
- Modern, simple API
- First-class support for React Email templates
- Matches our React/TypeScript stack
- Good deliverability out of the box
- Generous free tier for MVP

## Consequences

### Positive
- React Email templates match our stack
- Simple SDK integration
- Good developer experience
- Fast setup with verified domains

### Negative
- Newer provider than SendGrid/Postmark
- Smaller ecosystem and fewer integrations
- May need to switch if volume grows significantly
