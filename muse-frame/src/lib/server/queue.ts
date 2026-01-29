'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '~/db'
import { type OrderStatus, orders } from '~/db/schema'
import { generatePortrait } from '~/lib/server/modal'
import { getStyleById } from '~/lib/styles'

interface GenerationJob {
  orderId: number
  retryCount: number
  maxRetries: number
}

interface QueueStats {
  pending: number
  processing: boolean
}

class GenerationQueue {
  private queue: GenerationJob[] = []
  private processing = false
  private workerInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startWorker()
  }

  private startWorker() {
    this.workerInterval = setInterval(() => {
      this.processNextJob()
    }, 1000)
  }

  stopWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval)
      this.workerInterval = null
    }
  }

  enqueueGeneration(orderId: number, maxRetries = 1): void {
    const job: GenerationJob = {
      orderId,
      retryCount: 0,
      maxRetries,
    }
    this.queue.push(job)
    console.log(`Generation job enqueued for order ${orderId}. Queue size: ${this.queue.length}`)

    this.processNextJob()
  }

  private async processNextJob(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const job = this.queue.shift()

    if (!job) {
      this.processing = false
      return
    }

    try {
      await this.processJob(job)
    } catch (error) {
      console.error(`Error processing job for order ${job.orderId}:`, error)
    }

    this.processing = false
    this.processNextJob()
  }

  private async processJob(job: GenerationJob): Promise<void> {
    const { orderId, retryCount, maxRetries } = job

    const order = await getDb().select().from(orders).where(eq(orders.id, orderId)).get()

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    if (order.status !== 'paid') {
      console.log(`Order ${orderId} is not in 'paid' status, skipping generation`)
      return
    }

    const style = getStyleById(order.style)
    if (!style) {
      console.error(`Style '${order.style}' not found for order ${orderId}`)
      await this.updateOrderStatus(orderId, 'failed', 'Style not found')
      return
    }

    if (!order.uploadPath) {
      console.error(`No upload path for order ${orderId}`)
      await this.updateOrderStatus(orderId, 'failed', 'No uploaded image')
      return
    }

    console.log(`Starting generation for order ${orderId} (retry ${retryCount}/${maxRetries})`)

    await this.updateOrderStatus(orderId, 'generating')

    const result = await generatePortrait(order.uploadPath, style.promptTemplate)

    if (result.success && result.outputPath) {
      await this.updateOrderStatus(orderId, 'complete', undefined, result.outputPath)
      console.log(`Generation complete for order ${orderId}. Output: ${result.outputPath}`)
    } else {
      const errorMessage = result.error || 'Generation failed'
      console.error(`Generation failed for order ${orderId}: ${errorMessage}`)

      if (retryCount < maxRetries) {
        console.log(
          `Requeuing generation for order ${orderId} (retry ${retryCount + 1}/${maxRetries})`,
        )
        this.queue.push({
          orderId,
          retryCount: retryCount + 1,
          maxRetries,
        })
      } else {
        await this.updateOrderStatus(orderId, 'failed', errorMessage)
      }
    }
  }

  private async updateOrderStatus(
    orderId: number,
    status: typeof OrderStatus.Generating | typeof OrderStatus.Complete | typeof OrderStatus.Failed,
    error?: string,
    outputPath?: string,
  ): Promise<void> {
    const updateData: {
      status:
        | typeof OrderStatus.Generating
        | typeof OrderStatus.Complete
        | typeof OrderStatus.Failed
      updatedAt: Date
      outputPath?: string
      regenerationUsed?: boolean
    } = {
      status,
      updatedAt: new Date(),
    }

    if (outputPath) {
      updateData.outputPath = outputPath
    }

    if (status === 'failed' && error) {
      updateData.regenerationUsed = true
    }

    await getDb().update(orders).set(updateData).where(eq(orders.id, orderId))
  }

  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      processing: this.processing,
    }
  }

  clearQueue(): void {
    this.queue = []
    console.log('Generation queue cleared')
  }
}

export const generationQueue = new GenerationQueue()

export function getGenerationQueueStats(): QueueStats {
  return generationQueue.getStats()
}
