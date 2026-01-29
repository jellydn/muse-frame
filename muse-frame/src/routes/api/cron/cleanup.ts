'use server'

import { cleanupOldUploads } from '~/lib/server/cleanup'

export async function GET() {
  try {
    const result = await cleanupOldUploads()

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: result.deletedCount,
        errors: result.errors,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Cleanup job failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
