import { vi } from 'vitest'

export interface MockOrder {
  id: number
  email: string
  style: string
  status: string
  stripeSessionId?: string | null
  uploadPath?: string | null
  outputPath?: string | null
  regenerationUsed: boolean
  createdAt: Date
  updatedAt: Date
}

let mockOrders: MockOrder[] = []
let mockOrderIdCounter = 1

export function resetMockDb() {
  mockOrders = []
  mockOrderIdCounter = 1
}

export function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  const now = new Date()
  const order: MockOrder = {
    id: mockOrderIdCounter++,
    email: 'test@example.com',
    style: 'oil-painting',
    status: 'pending',
    stripeSessionId: null,
    uploadPath: null,
    outputPath: null,
    regenerationUsed: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  mockOrders.push(order)
  return order
}

export function createMockDb(): any {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          get: () => mockOrders[0] || null,
          all: () => mockOrders,
        }),
        orderBy: () => ({
          limit: () => ({
            offset: () => ({
              where: () => ({ all: () => mockOrders }),
              all: () => mockOrders,
            }),
          }),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          run: vi.fn(),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => ({
          get: () => mockOrders[0],
        }),
      }),
    }),
  }
}

export function mockDatabaseModule() {
  vi.doMock('~/db', () => ({
    getDb: vi.fn(() => createMockDb()),
  }))
}

export function mockModalService() {
  vi.doMock('~/lib/server/modal', () => ({
    generatePortrait: vi.fn(),
  }))
}

export function mockStylesModule() {
  vi.doMock('~/lib/styles', () => ({
    getStyleById: vi.fn((id: string) => {
      const styles: Record<string, { name: string; promptTemplate: string }> = {
        'oil-painting': { name: 'Oil Painting', promptTemplate: 'Convert to oil painting style' },
        watercolor: { name: 'Watercolor', promptTemplate: 'Convert to watercolor style' },
        sketch: { name: 'Sketch', promptTemplate: 'Convert to sketch style' },
      }
      return styles[id] || null
    }),
  }))
}

export function mockEmailModule() {
  vi.doMock('~/lib/server/email', () => ({
    sendDeliveryEmail: vi.fn(),
  }))
}

export async function withMockedModule(
  modulePath: string,
  mocks: Record<string, unknown>,
  testFn: () => void | Promise<void>,
) {
  for (const [path, mock] of Object.entries(mocks)) {
    vi.doMock(path, () => mock as any)
  }

  try {
    await testFn()
  } finally {
    vi.resetModules()
  }
}
