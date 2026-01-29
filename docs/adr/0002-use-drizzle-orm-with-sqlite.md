# 2. Use Drizzle ORM with SQLite

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs a database to store orders, track generation status, and manage download links. Requirements:

- Simple schema (orders, styles, generation jobs)
- Low operational overhead for MVP
- Type-safe queries matching TypeScript stack
- Potential to scale to edge (Turso) later

Options considered:
1. **Prisma** - Popular ORM with great DX
2. **Drizzle ORM** - Lightweight, type-safe, SQL-like
3. **Raw SQL** - Maximum control, no abstraction

## Decision

Use **Drizzle ORM** with **SQLite** as the database.

Key reasons:
- Fully type-safe with zero codegen required
- SQL-like syntax for developers familiar with SQL
- SQLite requires no external database server
- Easy migration path to Turso for edge deployment
- Lightweight bundle size

## Consequences

### Positive
- Zero infrastructure setup for database
- Type-safe queries catch errors at compile time
- Drizzle Studio for easy data inspection
- Simple migration to Turso when needed

### Negative
- SQLite limitations for concurrent writes (acceptable for MVP)
- Less ecosystem/plugins compared to Prisma
- Team needs to learn Drizzle API
