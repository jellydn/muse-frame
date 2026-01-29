'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'

export interface OrderDetails {
  id: number
  email: string
  style: string
  status: string
  uploadPath: string | null
  outputPath: string | null
  regenerationUsed: boolean
  createdAt: Date
  updatedAt: Date
}

export function getOrderById(orderId: string): OrderDetails | null {
  const orderIdNum = Number.parseInt(orderId, 10)

  if (Number.isNaN(orderIdNum)) {
    return null
  }

  const result = getDb().select().from(orders).where(eq(orders.id, orderIdNum)).get()

  if (!result) {
    return null
  }

  return {
    id: result.id,
    email: result.email,
    style: result.style,
    status: result.status,
    uploadPath: result.uploadPath,
    outputPath: result.outputPath,
    regenerationUsed: result.regenerationUsed,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}
