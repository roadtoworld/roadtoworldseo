export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url      = searchParams.get('url')
  const strategy = searchParams.get('strategy') || 'mobile'
  const key      = process.env.GOOGLE_PSI_KEY
  if (!url) return Response.json({ error: 'url param required' }, { status: 400 })
  if (!key) return Response.json({ error: 'GOOGLE_PSI_KEY not set in Vercel env vars' }, { status: 500 })
  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${key}&strategy=${strategy}`
  )
  const data = await res.json()
  return Response.json(data)
}
