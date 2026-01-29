# 8. Use Biome for Linting and Formatting

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs consistent code style and quality enforcement:
- Linting for catching bugs and enforcing best practices
- Formatting for consistent code style
- Fast execution for good developer experience
- TypeScript/React support

Options considered:
1. **ESLint + Prettier** - Industry standard, separate tools
2. **Biome** - All-in-one linter + formatter, Rust-based
3. **dprint + ESLint** - Fast formatter + traditional linter

## Decision

Use **Biome** as the unified linter and formatter.

Key reasons:
- Single tool replaces ESLint + Prettier
- 10-100x faster than ESLint (Rust-based)
- Zero configuration needed for sensible defaults
- Built-in TypeScript and React/JSX support
- Consistent formatting without Prettier conflicts

## Consequences

### Positive
- Blazing fast linting and formatting
- Single dependency instead of ESLint + Prettier + plugins
- No ESLint/Prettier configuration conflicts
- Simple setup with `biome.json`

### Negative
- Fewer rules than ESLint ecosystem
- Less plugin ecosystem
- Team may be unfamiliar with Biome
- Some ESLint rules not yet available
