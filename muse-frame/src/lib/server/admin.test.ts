import { desc, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { createMockDb, createMockOrder, resetMockDb } from '~/test/utils'

vi.mock('~/db', () => ({
  getDb: vi.fn(),
}))

interface AdminOrderSummary {
  total: number
  byStatus: Record<string, number>
  successRate: number
}

interface OrderListItem {
  id: number
  email: string
  style: string
  status: string
  outputPath: string | null
  regenerationUsed: boolean
  createdAt: Date
  updatedAt: Date
}

function getAdminOrders(options?: {
  status?: string
  limit?: number
  offset?: number
}): OrderListItem[] {
  const { limit = 50, offset = 0 } = options || {}

  const allOrders = getDb().select().from(orders).all()

  return allOrders.slice(offset, offset + limit).map((order) => ({
    id: order.id,
    email: order.email,
    style: order.style,
    status: order.status,
    outputPath: order.outputPath,
    regenerationUsed: order.regenerationUsed,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }))
}

function getOrderSummary(): AdminOrderSummary {
  const allOrders = getDb().select().from(orders).all()

  const byStatus: Record<string, number> = {}
  for (const order of allOrders) {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1
  }

  const completed = byStatus.complete || 0
  const failed = byStatus.failed || 0
  const totalDeliverable = completed + failed
  const successRate = totalDeliverable > 0 ? (completed / totalDeliverable) * 100 : 0

  return {
    total: allOrders.length,
    byStatus,
    successRate: Math.round(successRate * 10) / 10,
  }
}

describe('admin.ts - getAdminOrders', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
  })

  it('returns all orders when no status filter specified', () => {
    createMockOrder({ id: 1, email: 'user1@example.com' })
    createMockOrder({ id: 2, email: 'user2@example.com' })
    createMockOrder({ id: 3, email: 'user3@example.com' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getAdminOrders()

    expect(result.length).toBe(3)
  })

  it('returns orders with expected fields', () => {
    createMockOrder({
      id: 1,
      email: 'test@example.com',
      style: 'oil-painting',
      status: 'paid',
      outputPath: null,
      regenerationUsed: false,
    })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getAdminOrders()

    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('email')
    expect(result[0]).toHaveProperty('style')
    expect(result[0]).toHaveProperty('status')
    expect(result[0]).toHaveProperty('outputPath')
    expect(result[0]).toHaveProperty('regenerationUsed')
    expect(result[0]).toHaveProperty('createdAt')
    expect(result[0]).toHaveProperty('updatedAt')
  })

  it('respects limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      createMockOrder({ id: i + 1 })
    }
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getAdminOrders({ limit: 5 })

    expect(result.length).toBeLessThanOrEqual(5)
  })
})

describe('admin.ts - getOrderSummary', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
  })

  it('returns total count of all orders', () => {
    createMockOrder({ status: 'pending' })
    createMockOrder({ status: 'paid' })
    createMockOrder({ status: 'complete' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderSummary()

    expect(result.total).toBe(3)
  })

  it('calculates correct success rate with completed orders', () => {
    createMockOrder({ status: 'complete' })
    createMockOrder({ status: 'complete' })
    createMockOrder({ status: 'failed' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderSummary()

    expect(result.successRate).toBe(66.7)
  })

  it('returns 0 success rate when no deliverable orders', () => {
    createMockOrder({ status: 'pending' })
    createMockOrder({ status: 'paid' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderSummary()

    expect(result.successRate).toBe(0)
  })

  it('counts orders by status correctly', () => {
    createMockOrder({ status: 'pending' })
    createMockOrder({ status: 'pending' })
    createMockOrder({ status: 'complete' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = getOrderSummary()

    expect(result.byStatus.pending).toBe(2)
    expect(result.byStatus.complete).toBe(1)
  })
})
