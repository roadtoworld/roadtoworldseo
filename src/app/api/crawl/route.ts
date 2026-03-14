import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return Response.json({ error: 'url required' }, { status: 400 })

  const fullUrl = url.startsWith('http') ? url : 'https://' + url

  try {
    const res = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeridianSEO/1.0)' },
      signal: AbortSignal.timeout(10000)
    })
    const html = await res.text()

    // Parse title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    // Parse meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const metaDesc = metaMatch ? metaMatch[1].trim() : null

    // Parse H1s
    const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi)]
    const h1s = h1Matches.map(m => m[1].trim()).filter(Boolean)

    // Parse H2s
    const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/gi)]
    const h2s = h2Matches.map(m => m[1].trim()).filter(Boolean)

    // Parse canonical
    const canonMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
    const canonical = canonMatch ? canonMatch[1].trim() : null

    // Parse robots meta
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)
    const robots = robotsMatch ? robotsMatch[1].trim() : 'index, follow'

    // Count images missing alt
    const allImgs = [...html.matchAll(/<img[^>]*>/gi)]
    const imgsNoAlt = allImgs.filter(m => !m[0].match(/alt=["'][^"']+["']/i))

    // Parse internal links
    const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"']*)["']/gi)]
    const links = linkMatches.map(m => m[1]).filter(l => l && !l.startsWith('#') && !l.startsWith('mailto:'))

    // Check Open Graph
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    const ogDesc  = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)

    // Schema/JSON-LD
    const hasSchema = html.includes('application/ld+json')

    // Viewport meta
    const hasViewport = html.includes('name="viewport"') || html.includes("name='viewport'")

    return Response.json({
      url: fullUrl,
      status: res.status,
      title,
      titleLength: title ? title.length : 0,
      metaDesc,
      metaDescLength: metaDesc ? metaDesc.length : 0,
      h1s,
      h2s,
      canonical,
      robots,
      totalImages: allImgs.length,
      imagesNoAlt: imgsNoAlt.length,
      links: links.slice(0, 50),
      totalLinks: links.length,
      ogTitle: ogTitle ? ogTitle[1] : null,
      ogDesc: ogDesc ? ogDesc[1] : null,
      hasSchema,
      hasViewport,
      contentLength: html.length,
      issues: buildIssues({ title, metaDesc, h1s, canonical, imgsNoAlt, ogTitle, hasSchema })
    })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

function buildIssues({ title, metaDesc, h1s, canonical, imgsNoAlt, ogTitle, hasSchema }: any) {
  const issues = []
  if (!title) issues.push({ type: 'critical', msg: 'Missing title tag' })
  else if (title.length < 30) issues.push({ type: 'warning', msg: 'Title too short (' + title.length + ' chars)' })
  else if (title.length > 60) issues.push({ type: 'warning', msg: 'Title too long (' + title.length + ' chars)' })
  if (!metaDesc) issues.push({ type: 'critical', msg: 'Missing meta description' })
  else if (metaDesc.length < 50) issues.push({ type: 'warning', msg: 'Meta description too short' })
  else if (metaDesc.length > 160) issues.push({ type: 'warning', msg: 'Meta description too long' })
  if (h1s.length === 0) issues.push({ type: 'critical', msg: 'Missing H1 tag' })
  else if (h1s.length > 1) issues.push({ type: 'warning', msg: 'Multiple H1 tags (' + h1s.length + ')' })
  if (!canonical) issues.push({ type: 'info', msg: 'No canonical tag' })
  if (imgsNoAlt.length > 0) issues.push({ type: 'warning', msg: imgsNoAlt.length + ' images missing alt text' })
  if (!ogTitle) issues.push({ type: 'info', msg: 'Missing Open Graph tags' })
  if (!hasSchema) issues.push({ type: 'info', msg: 'No structured data (JSON-LD)' })
  return issues
}
