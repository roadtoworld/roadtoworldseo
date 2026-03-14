import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return Response.redirect(new URL('/?auth=error', request.url))
  }

  if (!code) {
    return Response.redirect(new URL('/?auth=error', request.url))
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri  = 'https://roadtoworldseo.vercel.app/api/auth/callback'

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code'
    })
  })

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return Response.redirect(new URL('/?auth=error', request.url))
  }

  const params = new URLSearchParams({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || ''
  })

  return Response.redirect(new URL('/?' + params.toString(), request.url))
}
