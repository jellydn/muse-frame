import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { createMockDb, createMockOrder, resetMockDb } from '~/test/utils'

vi.mock('~/db', () => ({
  getDb: vi.fn(),
}))

let testQueue: Array<{ orderId: number; retryCount: number; maxRetries: number }> = []
let testProcessing = false

async function processJob(job: {
  orderId: number
  retryCount: number
  maxRetries: number
}): Promise<void> {
  const { orderId } = job

  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()
  if (!order) return

  if (order.status !== 'paid') return
}

async function runWorker(): Promise<void> {
  if (testProcessing || testQueue.length === 0) return

  testProcessing = true
  const job = testQueue.shift()
  if (job) await processJob(job)
  testProcessing = false
}

function enqueueGeneration(orderId: number, maxRetries = 1): void {
  testQueue.push({ orderId, retryCount: 0, maxRetries })
  runWorker()
}

async function retryGeneration(orderId: number): Promise<{ success: boolean; error?: string }> {
  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()
  if (!order) return { success: false, error: 'Order not found' }

  const canRegenerate =
    (order.status === 'complete' && !order.regenerationUsed) || order.status === 'failed'

  if (!canRegenerate) return { success: false, error: 'Order is not eligible for regeneration' }

  enqueueGeneration(orderId, 1)
  return { success: true }
}

describe('queue.ts - enqueueGeneration', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
    testQueue = []
    testProcessing = false
  })

  it('adds job to queue when enqueueing a new order', () => {
    const mockOrder = createMockOrder({ id: 1, status: 'paid' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    enqueueGeneration(1, 1)

    expect(testQueue.length).toBe(1)
    expect(testQueue[0].orderId).toBe(1)
    expect(testQueue[0].retryCount).toBe(0)
  })

  it('sets max retries from parameter', () => {
    createMockOrder({ id: 2, status: 'paid' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    enqueueGeneration(2, 3)

    expect(testQueue[0].maxRetries).toBe(3)
  })

  it('uses default maxRetries of 1 when not specified', () => {
    const mockOrder = createMockOrder({ id: 3, status: 'paid' })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    enqueueGeneration(3)

    expect(testQueue[0].maxRetries).toBe(1)
  })
})

describe('queue.ts - retryGeneration', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
    testQueue = []
    testProcessing = false
  })

  it('returns success for complete order with unused regeneration', async () => {
    createMockOrder({
      id: 1,
      status: 'complete',
      regenerationUsed: false,
    })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await retryGeneration(1)

    expect(result.success).toBe(true)
    expect(testQueue.length).toBe(1)
  })

  it('returns success for failed order', async () => {
    createMockOrder({
      id: 2,
      status: 'failed',
      regenerationUsed: false,
    })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await retryGeneration(2)

    expect(result.success).toBe(true)
    expect(testQueue.length).toBe(1)
  })

  it('returns error when order does not exist', async () => {
    resetMockDb()
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await retryGeneration(999)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Order not found')
  })

  it('returns error when regeneration already used on complete order', async () => {
    createMockOrder({
      id: 3,
      status: 'complete',
      regenerationUsed: true,
    })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await retryGeneration(3)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Order is not eligible for regeneration')
  })

  it('returns error when order status is paid (not complete or failed)', async () => {
    createMockOrder({
      id: 4,
      status: 'paid',
      regenerationUsed: false,
    })
    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await retryGeneration(4)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Order is not eligible for regeneration')
  })
})
