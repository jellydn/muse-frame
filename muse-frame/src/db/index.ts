import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { env } from '~/lib/env'

let dbInstance: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!dbInstance) {
    const sqlite = new Database(env.DATABASE_URL)
    dbInstance = drizzle(sqlite)
  }
  return dbInstance
}

export type Db = ReturnType<typeof getDb>
