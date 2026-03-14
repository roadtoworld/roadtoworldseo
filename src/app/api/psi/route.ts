export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const key = process.env.GOOGLE_PSI_KEY
  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${key}&strategy=mobile`
  )
  const data = await res.json()
  return Response.json(data)
}
