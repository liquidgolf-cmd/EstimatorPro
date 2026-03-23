import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client uses service role key — bypasses RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId, realmId } = req.query

  if (!code || !userId || !realmId) {
    return res.redirect('/settings?qbo=error&reason=missing_params')
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch(
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
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: process.env.QBO_REDIRECT_URI!,
        }),
      }
    )

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      console.error('QBO token exchange failed:', tokens)
      return res.redirect('/settings?qbo=error&reason=token_exchange')
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store tokens in qbo_tokens table
    const { error } = await supabase.from('qbo_tokens').upsert({
      user_id: userId,
      realm_id: realmId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to store QBO tokens:', error)
      return res.redirect('/settings?qbo=error&reason=storage')
    }

    res.redirect('/settings?qbo=connected')
  } catch (err) {
    console.error('QBO callback error:', err)
    res.redirect('/settings?qbo=error&reason=server')
  }
}
