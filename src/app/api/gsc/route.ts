import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const siteUrl     = searchParams.get('url')
  const accessToken = searchParams.get('token')
  const days        = parseInt(searchParams.get('days') || '30')

  if (!siteUrl || !accessToken) {
    return Response.json({ error: 'url and token required' }, { status: 400 })
  }

  const endDate   = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  try {
    // Fetch keywords
    const kwRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 100
        })
      }
    )
    const kwData = await kwRes.json()

    // Fetch traffic over time
    const trafficRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['date'],
          rowLimit: 90
        })
      }
    )
    const trafficData = await trafficRes.json()

    return Response.json({
      keywords: kwData.rows || [],
      traffic:  trafficData.rows || [],
      error:    kwData.error || null
    })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
