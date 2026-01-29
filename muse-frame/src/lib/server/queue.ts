'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { generatePortrait } from '~/lib/server/modal'
import { getStyleById } from '~/lib/styles'
import { sendDeliveryEmail } from './email'

interface Job {
  orderId: number
  retryCount: number
  maxRetries: number
}

const queue: Job[] = []
let processing = false

async function processJob(job: Job): Promise<void> {
  const { orderId, retryCount, maxRetries } = job

  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()
  if (!order) return

  if (order.status !== 'paid') return

  const style = getStyleById(order.style)
  if (!style) {
    await updateOrderStatus(orderId, 'failed', 'Style not found')
    return
  }

  if (!order.uploadPath) {
    await updateOrderStatus(orderId, 'failed', 'No uploaded image')
    return
  }

  console.log(`Starting generation for order ${orderId} (retry ${retryCount}/${maxRetries})`)
  await updateOrderStatus(orderId, 'generating')

  const result = await generatePortrait(order.uploadPath, style.promptTemplate)

  if (result.success && result.outputPath) {
    await updateOrderStatus(orderId, 'complete', undefined, result.outputPath)
    await sendDeliveryEmail(orderId, order.email, style.name, result.outputPath)
  } else {
    const errorMessage = result.error || 'Generation failed'
    console.error(`Generation failed for order ${orderId}: ${errorMessage}`)

    if (retryCount < maxRetries) {
      queue.push({ orderId, retryCount: retryCount + 1, maxRetries })
    } else {
      await updateOrderStatus(orderId, 'failed', errorMessage)
    }
  }
}

async function updateOrderStatus(
  orderId: number,
  status: 'generating' | 'complete' | 'failed',
  error?: string,
  outputPath?: string,
): Promise<void> {
  const updateData: {
    status: 'generating' | 'complete' | 'failed'
    updatedAt: Date
    outputPath?: string
    regenerationUsed?: boolean
  } = { status, updatedAt: new Date() }

  if (outputPath) updateData.outputPath = outputPath
  if (status === 'failed' && error) updateData.regenerationUsed = true

  await getDb().update(orders).set(updateData).where(eq(orders.id, orderId))
}

async function runWorker(): Promise<void> {
  if (processing || queue.length === 0) return

  processing = true
  const job = queue.shift()
  if (job) await processJob(job)
  processing = false
}

export function enqueueGeneration(orderId: number, maxRetries = 1): void {
  queue.push({ orderId, retryCount: 0, maxRetries })
  runWorker()
}

export async function retryGeneration(
  orderId: number,
): Promise<{ success: boolean; error?: string }> {
  const order = getDb().select().from(orders).where(eq(orders.id, orderId)).get()
  if (!order) return { success: false, error: 'Order not found' }

  const canRegenerate =
    (order.status === 'complete' && !order.regenerationUsed) || order.status === 'failed'

  if (!canRegenerate) return { success: false, error: 'Order is not eligible for regeneration' }

  await getDb()
    .update(orders)
    .set({
      status: 'paid' as const,
      regenerationUsed: order.status === 'complete' ? false : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  enqueueGeneration(orderId, 1)
  return { success: true }
}
