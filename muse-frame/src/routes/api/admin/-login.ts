'use server'

import { env } from '~/lib/env'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST({ request }: { request: Request }) {
  try {
    const { password } = await request.json()

    if (password === env.ADMIN_SECRET) return json({ success: true })
    return json({ success: false, error: 'Invalid password' }, 401)
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }
}
