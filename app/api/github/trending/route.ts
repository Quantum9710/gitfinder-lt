import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const language = searchParams.get('language') || ''
  const timeRange = searchParams.get('timeRange') || 'month' // 'day' | 'week' | 'month' | 'all'
  const perPage = searchParams.get('per_page') || '10'

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFinder-LT-App',
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `token ${token}`
  }

  // Calculate date filter based on time range
  let dateQuery = ''
  const now = new Date()
  if (timeRange === 'day') {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    dateQuery = `created:>${yesterday.toISOString().split('T')[0]}`
  } else if (timeRange === 'week') {
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    dateQuery = `created:>${lastWeek.toISOString().split('T')[0]}`
  } else if (timeRange === 'month') {
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    dateQuery = `created:>${lastMonth.toISOString().split('T')[0]}`
  } else {
    // all time
    dateQuery = 'stars:>50000'
  }

  let query = dateQuery
  if (language && language !== 'all') {
    query += `+language:${encodeURIComponent(language)}`
  }

  try {
    const endpoint = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perPage}`

    const response = await fetch(endpoint, {
      headers,
      next: { revalidate: 300 }, // 5 minutes cache
    })

    if (!response.ok) {
      // If time-scoped query returned 0 or rate limited, fallback to top starred general query
      const fallbackEndpoint = `https://api.github.com/search/repositories?q=stars:>25000${
        language && language !== 'all' ? `+language:${encodeURIComponent(language)}` : ''
      }&sort=stars&order=desc&per_page=${perPage}`

      const fallbackRes = await fetch(fallbackEndpoint, { headers })
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json()
        return NextResponse.json({
          items: fallbackData.items || [],
          total_count: fallbackData.total_count || 0,
        })
      }

      return NextResponse.json(
        { error: 'GitHub rate limit or temporary service issue. Please try again later.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    // If fewer than 4 items returned (e.g. strict time query), fallback to broad stars query
    if (!data.items || data.items.length < 3) {
      const fallbackEndpoint = `https://api.github.com/search/repositories?q=stars:>30000${
        language && language !== 'all' ? `+language:${encodeURIComponent(language)}` : ''
      }&sort=stars&order=desc&per_page=${perPage}`
      const fallbackRes = await fetch(fallbackEndpoint, { headers })
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json()
        return NextResponse.json({
          items: fallbackData.items || [],
          total_count: fallbackData.total_count || 0,
        })
      }
    }

    return NextResponse.json({
      items: data.items || [],
      total_count: data.total_count || 0,
    })
  } catch (err) {
    console.error('Trending repos fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch trending repositories' }, { status: 500 })
  }
}
