import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const OrderStatus = {
  Pending: 'pending',
  Paid: 'paid',
  Generating: 'generating',
  Complete: 'complete',
  Failed: 'failed',
  Refunded: 'refunded',
} as const

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  style: text('style').notNull(),
  status: text('status', {
    enum: [
      OrderStatus.Pending,
      OrderStatus.Paid,
      OrderStatus.Generating,
      OrderStatus.Complete,
      OrderStatus.Failed,
      OrderStatus.Refunded,
    ],
  })
    .notNull()
    .default(OrderStatus.Pending),
  stripeSessionId: text('stripe_session_id'),
  uploadPath: text('upload_path'),
  outputPath: text('output_path'),
  regenerationUsed: integer('regeneration_used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})
