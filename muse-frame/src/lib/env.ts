// Environment variables configuration
// In production, these should be set in the deployment platform

export const env = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'file:/Users/huynhdung/src/tries/2026-01-29-muse-frame/muse-frame/sqlite.db',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
  MODAL_TOKEN_ID: process.env.MODAL_TOKEN_ID || '',
  MODAL_TOKEN_SECRET: process.env.MODAL_TOKEN_SECRET || '',
}

export type EnvSchema = typeof env
