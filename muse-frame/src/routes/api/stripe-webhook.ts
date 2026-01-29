'use server'

import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { env } from '~/lib/env'
import { enqueueGeneration } from '~/lib/server/queue'

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
})

export async function POST(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook processing error: ${message}`)
    return new Response(`Webhook processing error: ${message}`, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (!orderId) {
    console.error('No orderId in session metadata')
    return
  }

  const orderIdNum = Number.parseInt(orderId, 10)
  if (Number.isNaN(orderIdNum)) {
    console.error('Invalid orderId in session metadata:', orderId)
    return
  }

  // Update order status from 'pending' to 'paid'
  await getDb()
    .update(orders)
    .set({
      status: 'paid',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderIdNum))

  console.log(`Order ${orderIdNum} marked as paid`)

  // Trigger generation job via the queue
  enqueueGeneration(orderIdNum)
}
