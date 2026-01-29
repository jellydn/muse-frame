# 1. Use TanStack Start with React

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame is an MVP web application for AI-generated personalized portraits. The application needs:

- Server-side rendering (SSR) for SEO and performance
- Type-safe routing and data fetching
- Integration with backend services (Stripe, Resend, Cloudflare R2)
- Modern React development experience

Options considered:
1. **Next.js** - Most popular React meta-framework
2. **Remix** - Full-stack web framework with focus on web standards
3. **TanStack Start** - New framework from TanStack with type-safe routing

## Decision

Use **TanStack Start** with React and Vite as the application framework.

Key reasons:
- First-class TypeScript support with fully type-safe routing
- Built on Vite for fast development experience
- Seamless integration with TanStack Router and TanStack Query
- Server functions for backend logic without separate API layer
- Modern React patterns (Server Components ready)

## Consequences

### Positive
- Type-safe routing eliminates runtime routing errors
- Vite provides excellent DX with fast HMR
- TanStack ecosystem consistency (Router, Query, Form)
- Server functions simplify API development

### Negative
- Newer framework with smaller community than Next.js
- Less documentation and fewer tutorials available
- Potential stability concerns as framework matures
- Team may need to learn new patterns
