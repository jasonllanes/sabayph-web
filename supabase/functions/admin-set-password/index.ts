// @ts-nocheck — Deno runtime; Node tsconfig errors are expected and harmless
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAILS = ['llanesjason19@gmail.com']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Verify the calling session belongs to an admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.slice(7))
    if (authErr || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      return json({ error: 'Forbidden' }, 403)
    }

    const { userId, newPassword } = await req.json() as { userId?: string; newPassword?: string }
    if (!userId || !newPassword || newPassword.length < 8) {
      return json({ error: 'userId and newPassword (min 8 chars) are required' }, 400)
    }

    // Use service role to update the target user's password
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return json({ error: error.message }, 400)

    return json({ success: true })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
