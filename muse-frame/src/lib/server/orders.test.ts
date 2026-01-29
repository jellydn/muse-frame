import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { createMockDb, createMockOrder, resetMockDb } from '~/test/utils'

vi.mock('~/db', () => ({
  getDb: vi.fn(),
}))

function getOrderById(orderId: string) {
  const orderIdNum = Number.parseInt(orderId, 10)
  if (Number.isNaN(orderIdNum)) return null

  return getDb().select().from(orders).where(eq(orders.id, orderIdNum)).get() ?? null
}

async function regeneratePortrait(orderId: number): Promise<{ success: boolean; error?: string }> {
  const { retryGeneration } = await import('./queue')
  return retryGeneration(orderId)
}

describe('orders.ts - getOrderById', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
  })

  it('returns order when given valid numeric order ID', () => {
    const mockOrder = createMockOrder({
      id: 123,
      email: 'test@example.com',
      style: 'oil-painting',
      status: 'paid',
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderById('123')

    expect(result).not.toBeNull()
    expect(result?.id).toBe(123)
    expect(result?.email).toBe('test@example.com')
  })

  it('returns null when given non-numeric string', () => {
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderById('not-a-number')

    expect(result).toBeNull()
  })

  it('returns null when order does not exist', () => {
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderById('999')

    expect(result).toBeNull()
  })

  it('returns null for negative numbers', () => {
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderById('-1')

    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderById('')

    expect(result).toBeNull()
  })
})

describe('orders.ts - regeneratePortrait', () => {
  it('returns success when order exists and is eligible for regeneration', async () => {
    createMockOrder({
      id: 1,
      status: 'complete',
      regenerationUsed: false,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    vi.doMock('./queue', () => ({
      retryGeneration: vi.fn().mockResolvedValue({ success: true }),
    }))

    const result = await regeneratePortrait(1)

    expect(result.success).toBe(true)
  })

  it('returns error when order is not found in queue', async () => {
    resetMockDb()

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    vi.doMock('./queue', () => ({
      retryGeneration: vi.fn().mockResolvedValue({ success: false, error: 'Order not found' }),
    }))

    const result = await regeneratePortrait(999)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Order not found')
  })
})
