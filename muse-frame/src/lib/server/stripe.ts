'use server'

import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { db } from '~/db'
import { orders } from '~/db/schema'
import { env } from '~/lib/env'
import { getStyleById } from '~/lib/styles'

export interface CreateCheckoutResult {
  success: boolean
  checkoutUrl?: string
  orderId?: number
  error?: string
}

export async function createCheckout(
  styleId: string,
  uploadPath: string,
  email: string,
): Promise<CreateCheckoutResult> {
  // Validate style exists
  const style = getStyleById(styleId)
  if (!style) {
    return {
      success: false,
      error: 'Invalid style selected. Please choose a valid style.',
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    }
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  })

  try {
    // Create order record with status 'pending'
    const [order] = await db
      .insert(orders)
      .values({
        email,
        style: styleId,
        status: 'pending',
        uploadPath,
        stripeSessionId: null,
        outputPath: null,
        regenerationUsed: false,
      })
      .returning({ id: orders.id })

    const orderId = order.id

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${style.name} Portrait`,
              description: style.description,
            },
            unit_amount: style.price, // Price in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: orderId.toString(),
        styleId,
        uploadPath,
      },
      success_url: `${env.R2_PUBLIC_URL || ''}/order/${orderId}/status`,
      cancel_url: `${env.R2_PUBLIC_URL || ''}/upload?style=${styleId}`,
    })

    // Update order with Stripe session ID
    await db
      .update(orders)
      .set({
        stripeSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return {
      success: true,
      checkoutUrl: session.url || undefined,
      orderId,
    }
  } catch (error) {
    console.error('Checkout error:', error)
    return {
      success: false,
      error: 'Failed to create checkout session. Please try again.',
    }
  }
}
