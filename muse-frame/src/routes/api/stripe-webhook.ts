'use server'

import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { env } from '~/lib/env'

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

  // Trigger generation job (placeholder for US-013)
  await triggerGenerationJob(orderIdNum)
}

async function triggerGenerationJob(orderId: number) {
  // This is a placeholder for the generation job queue (US-013)
  // For now, we just log that the job should be triggered
  console.log(`Generation job should be triggered for order ${orderId}`)

  // TODO: Implement job queue processing in US-013
  // For now, simulate async generation
  setTimeout(async () => {
    try {
      // Update status to 'generating'
      await getDb()
        .update(orders)
        .set({
          status: 'generating',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))

      console.log(`Order ${orderId} status updated to 'generating'`)

      // Simulate generation completion after 5 seconds (placeholder)
      // In production, this would be handled by Modal serverless function
      await simulateGeneration(orderId)
    } catch (error) {
      console.error(`Error triggering generation for order ${orderId}:`, error)
    }
  }, 1000)
}

async function simulateGeneration(orderId: number) {
  // Placeholder for AI generation - simulates successful generation
  // This will be replaced with actual Modal integration in US-012
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // For demo purposes, we'll just log and update to 'complete'
    // In production, this would call Modal API and upload result to R2
    await getDb()
      .update(orders)
      .set({
        status: 'complete',
        outputPath: `generated/${orderId}/output.png`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    console.log(`Order ${orderId} generation complete`)
  } catch (error) {
    console.error(`Generation failed for order ${orderId}:`, error)
    await getDb()
      .update(orders)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
  }
}
