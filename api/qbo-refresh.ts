import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getValidToken(userId: string): Promise<{ accessToken: string; realmId: string } | null> {
  const { data, error } = await supabase
    .from('qbo_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  // Token still valid — return it
  if (new Date(data.expires_at) > new Date(Date.now() + 60_000)) {
    return { accessToken: data.access_token, realmId: data.realm_id }
  }

  // Token expired — refresh it
  try {
    const res = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
            ).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: data.refresh_token,
        }),
      }
    )

    const fresh = await res.json()
    if (!fresh.access_token) return null

    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString()

    await supabase.from('qbo_tokens').update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    return { accessToken: fresh.access_token, realmId: data.realm_id }
  } catch (err) {
    console.error('Token refresh failed:', err)
    return null
  }
}

// Also expose as a callable endpoint
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.body ?? {}
  if (!userId) return res.status(400).json({ error: 'userId required' })
  const result = await getValidToken(userId)
  if (!result) return res.status(401).json({ error: 'No valid token' })
  res.json({ ok: true })
}
