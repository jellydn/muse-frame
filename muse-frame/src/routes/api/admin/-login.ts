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

    if (password === env.ADMIN_SECRET) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie':
            'admin_session=authenticated; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400',
        },
      })
    }
    return json({ success: false, error: 'Invalid password' }, 401)
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }
}
