'use server'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { eq, lt } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { env } from '~/lib/env'

const s3Client = new (await import('@aws-sdk/client-s3')).S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

interface CleanupResult {
  deletedCount: number
  errors: string[]
}

/**
 * Clean up uploaded photos older than 7 days
 * This function should be run as a scheduled job (e.g., daily via cron)
 */
export async function cleanupOldUploads(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    errors: [],
  }

  // Calculate the cutoff date (7 days ago)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Find orders with uploads older than 7 days that still have their uploadPath
  const oldOrders = getDb().select().from(orders).where(lt(orders.createdAt, sevenDaysAgo)).all()

  for (const order of oldOrders) {
    if (!order.uploadPath) continue

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: order.uploadPath,
      })

      await s3Client.send(deleteCommand)

      // Clear the uploadPath from the database
      getDb().update(orders).set({ uploadPath: null }).where(eq(orders.id, order.id))

      result.deletedCount++
      console.log(`Deleted upload for order ${order.id}: ${order.uploadPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Failed to delete ${order.uploadPath}: ${errorMessage}`)
      console.error(`Failed to delete upload for order ${order.id}:`, error)
    }
  }

  console.log(`Cleanup complete. Deleted ${result.deletedCount} uploads.`)
  return result
}
