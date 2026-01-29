'use server'

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { eq, lt } from 'drizzle-orm'
import { getDb } from '~/db'
import { orders } from '~/db/schema'
import { env } from '~/lib/env'

const s3Client = new S3Client({
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

export async function cleanupOldUploads(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    errors: [],
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const oldOrders = getDb().select().from(orders).where(lt(orders.createdAt, sevenDaysAgo)).all()

  for (const order of oldOrders) {
    if (!order.uploadPath) continue

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: order.uploadPath,
      })

      await s3Client.send(deleteCommand)

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
