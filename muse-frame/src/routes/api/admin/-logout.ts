'use server'

export async function POST() {
  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    },
  })
}
