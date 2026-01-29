# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Runner:**
- No test framework currently configured
- Playwright v1.58.0 available as dev dependency (E2E only)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test scripts defined in package.json
# Recommended setup with Vitest:
pnpm add -D vitest
pnpm vitest run              # Run all tests
pnpm vitest --watch          # Watch mode
pnpm vitest run --coverage   # Coverage
```

## Test File Organization

**Location:**
- No test files exist currently
- Recommended: co-locate with source files

**Naming:**
- Recommended: `*.test.ts` / `*.test.tsx`

**Structure:**
```
src/
├── lib/
│   ├── styles.ts
│   └── styles.test.ts      # ← Recommended location
├── routes/
│   └── __tests__/          # ← Alternative for route tests
└── db/
    └── schema.test.ts      # ← Schema validation tests
```

## Test Structure

**Suite Organization:**
```typescript
// Recommended pattern for this codebase
import { describe, it, expect } from 'vitest'
import { getStyleById, getStylesByCategory } from './styles'

describe('styles', () => {
  describe('getStyleById', () => {
    it('returns style when found', () => {
      const style = getStyleById('princess')
      expect(style).toBeDefined()
      expect(style?.name).toBe('Princess')
    })

    it('returns undefined for invalid id', () => {
      expect(getStyleById('nonexistent')).toBeUndefined()
    })
  })
})
```

**Patterns:**
- Setup: Use `beforeEach` for test isolation
- Teardown: Clean up mocks in `afterEach`
- Assertions: Single responsibility per test

## Mocking

**Framework:** Not configured (Vitest recommended)

**Patterns:**
```typescript
// Recommended for this codebase
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock environment variables
vi.mock('~/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'test_key',
    R2_BUCKET_NAME: 'test-bucket',
  },
}))

// Mock database
vi.mock('~/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  },
}))
```

**What to Mock:**
- External APIs (Stripe, S3/R2)
- Database operations
- Environment variables
- File system operations

**What NOT to Mock:**
- Pure utility functions (`getStyleById`, `getStylesByCategory`)
- Type definitions
- Validation logic (test actual behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// Recommended pattern
// src/__tests__/fixtures/orders.ts
export const createTestOrder = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  style: 'princess',
  status: 'pending',
  uploadPath: 'uploads/test/image.jpg',
  ...overrides,
})

export const createTestStyle = (overrides = {}) => ({
  id: 'test-style',
  name: 'Test Style',
  description: 'A test style',
  category: 'unisex' as const,
  price: 1000,
  previewImage: '/test.jpg',
  promptTemplate: 'test prompt',
  ...overrides,
})
```

**Location:**
- Recommended: `src/__tests__/fixtures/`

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# After setting up Vitest
pnpm vitest run --coverage
```

## Test Types

**Unit Tests:**
- Pure functions in `~/lib/` (styles, validation)
- Database schema validation
- Component rendering (with React Testing Library)

**Integration Tests:**
- Server functions with mocked external services
- API route handlers
- Database operations with in-memory SQLite

**E2E Tests:**
- Playwright available but not configured
- Recommended for critical user flows:
  - Style selection → Upload → Checkout flow
  - Order status page

## Common Patterns

**Async Testing:**
```typescript
it('uploads photo successfully', async () => {
  const result = await uploadPhoto(mockFile, 'princess')
  expect(result.success).toBe(true)
  expect(result.uploadPath).toBeDefined()
})
```

**Error Testing:**
```typescript
it('returns error for invalid file type', async () => {
  const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
  const result = await uploadPhoto(invalidFile, 'princess')
  
  expect(result.success).toBe(false)
  expect(result.error).toContain('Invalid file type')
})
```

## Recommended Setup

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
```

---

*Testing analysis: 2026-01-30*
