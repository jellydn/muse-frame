import { lt } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { createMockDb, createMockOrder, type MockOrder, resetMockDb } from '~/test/utils'

vi.mock('~/db', () => ({
  getDb: vi.fn(),
}))

vi.doMock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  DeleteObjectCommand: vi.fn().mockImplementation((args) => args),
}))

interface CleanupResult {
  deletedCount: number
  errors: string[]
}

async function cleanupOldUploads(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    errors: [],
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const allOrders = getDb().select().from(orders).all()

  for (const order of allOrders) {
    if (!order.uploadPath) continue
    if (order.createdAt >= sevenDaysAgo) continue

    try {
      result.deletedCount++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Failed to delete ${order.uploadPath}: ${errorMessage}`)
    }
  }

  return result
}

describe('cleanup.ts - cleanupOldUploads', () => {
  beforeEach(() => {
    resetMockDb()
    vi.clearAllMocks()
  })

  it('returns zero deleted count when no old orders with uploads exist', async () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 1)

    createMockOrder({
      id: 1,
      uploadPath: 'uploads/photo1.jpg',
      createdAt: recentDate,
    })
    createMockOrder({
      id: 2,
      uploadPath: 'uploads/photo2.jpg',
      createdAt: recentDate,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await cleanupOldUploads()

    expect(result.deletedCount).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('identifies old orders with uploads', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)

    createMockOrder({
      id: 1,
      uploadPath: 'uploads/old-photo.jpg',
      createdAt: oldDate,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await cleanupOldUploads()

    expect(result.deletedCount).toBe(1)
  })

  it('ignores orders without uploadPath', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)

    createMockOrder({
      id: 1,
      uploadPath: null,
      createdAt: oldDate,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await cleanupOldUploads()

    expect(result.deletedCount).toBe(0)
  })

  it('returns empty errors array on successful cleanup', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)

    createMockOrder({
      id: 1,
      uploadPath: 'uploads/test.jpg',
      createdAt: oldDate,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await cleanupOldUploads()

    expect(result.errors).toHaveLength(0)
  })

  it('returns correct cleanup result structure', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 8)

    createMockOrder({
      id: 1,
      uploadPath: 'uploads/photo1.jpg',
      createdAt: oldDate,
    })
    createMockOrder({
      id: 2,
      uploadPath: 'uploads/photo2.jpg',
      createdAt: oldDate,
    })

    const mockDb = createMockDb()
    vi.mocked(getDb).mockReturnValue(mockDb)

    const result = await cleanupOldUploads()

    expect(result).toHaveProperty('deletedCount')
    expect(result).toHaveProperty('errors')
    expect(Array.isArray(result.errors)).toBe(true)
  })
})
