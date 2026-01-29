'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'

export function getOrderById(orderId: string) {
  const orderIdNum = Number.parseInt(orderId, 10)
  if (Number.isNaN(orderIdNum)) return null

  return getDb().select().from(orders).where(eq(orders.id, orderIdNum)).get() ?? null
}

export async function regeneratePortrait(
  orderId: number,
): Promise<{ success: boolean; error?: string }> {
  const { retryGeneration } = await import('./queue')
  return retryGeneration(orderId)
}
