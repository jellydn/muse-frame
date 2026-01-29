'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { generateSignedDownloadUrl } from '~/lib/server/email'

export async function GET({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const orderIdNum = Number.parseInt(orderId, 10)

  if (Number.isNaN(orderIdNum)) return new Response('Invalid order ID', { status: 400 })

  const order = getDb().select().from(orders).where(eq(orders.id, orderIdNum)).get()

  if (!order) return new Response('Order not found', { status: 404 })
  if (order.status !== 'complete' || !order.outputPath)
    return new Response('Portrait not available', { status: 404 })

  try {
    const signedUrl = await generateSignedDownloadUrl(order.outputPath, 7)
    return Response.redirect(signedUrl, 302)
  } catch (error) {
    console.error('Failed to generate download URL:', error)
    return new Response('Failed to generate download URL', { status: 500 })
  }
}
