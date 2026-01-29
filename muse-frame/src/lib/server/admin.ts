'use server'

import { desc, eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { getDb } from '~/db'
import { OrderStatus, orders } from '~/db/schema'
import { env } from '~/lib/env'
import { retryGeneration } from './queue'

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
})

export interface AdminOrderSummary {
  total: number
  byStatus: Record<string, number>
  successRate: number
}

export interface OrderListItem {
  id: number
  email: string
  style: string
  status: string
  outputPath: string | null
  regenerationUsed: boolean
  createdAt: Date
  updatedAt: Date
}

export function getAdminOrders(options?: {
  status?: string
  limit?: number
  offset?: number
}): OrderListItem[] {
  const { status, limit = 50, offset = 0 } = options || {}

  const baseQuery = getDb()
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  const results =
    status && status !== 'all'
      ? baseQuery.where(eq(orders.status, status as OrderStatus)).all()
      : baseQuery.all()

  return results.map((order) => ({
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

export function getOrderSummary(): AdminOrderSummary {
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

export async function adminRetryGeneration(
  orderId: number,
): Promise<{ success: boolean; error?: string }> {
  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()

  if (!order) return { success: false, error: 'Order not found' }

  const canRetry =
    order.status === 'failed' || (order.status === 'complete' && !order.regenerationUsed)

  if (!canRetry) return { success: false, error: 'Order is not eligible for retry' }

  getDb()
    .update(orders)
    .set({ status: OrderStatus.Paid, regenerationUsed: false, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  retryGeneration(orderId)

  return { success: true }
}

export async function adminRefundOrder(
  orderId: number,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()

  if (!order) return { success: false, error: 'Order not found' }

  const isRefundable = order.status === 'paid' || order.status === 'failed'
  if (!isRefundable) return { success: false, error: 'Order cannot be refunded' }

  if (order.stripeSessionId) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripeSessionId,
        reason: 'requested_by_customer',
      })
    } catch (error) {
      console.error('Stripe refund failed:', error)
      return { success: false, error: 'Stripe refund failed' }
    }
  }

  getDb()
    .update(orders)
    .set({
      status: OrderStatus.Refunded,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  if (reason) console.log(`Order ${orderId} refunded. Reason: ${reason}`)
  return { success: true }
}
