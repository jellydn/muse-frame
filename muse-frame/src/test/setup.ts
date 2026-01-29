import { afterEach, beforeEach, vi } from 'vitest'

const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeEach(() => {
  vi.clearAllMocks()
  console.log = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})
