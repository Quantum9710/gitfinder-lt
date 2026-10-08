import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') || 'repositories' // 'repositories' | 'users'
  const sort = searchParams.get('sort') || 'stars'
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '12'

  if (!q) {
    return NextResponse.json({ items: [], total_count: 0 }, { status: 200 })
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFinder-LT-App',
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `token ${token}`
  }

  try {
    let endpoint = ''
    if (type === 'users') {
      endpoint = `https://api.github.com/search/users?q=${encodeURIComponent(q)}&sort=followers&order=desc&page=${page}&per_page=${perPage}`
    } else {
      // Repositories search
      const sortParam = sort === 'best-match' ? '' : `&sort=${sort}&order=desc`
      endpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}${sortParam}&page=${page}&per_page=${perPage}`
    }

    const response = await fetch(endpoint, {
      headers,
      next: { revalidate: 60 },
    })

    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
    const rateLimitReset = response.headers.get('x-ratelimit-reset')

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 403 && rateLimitRemaining === '0') {
        return NextResponse.json(
          {
            error: 'GitHub API rate limit reached. Please wait a moment or configure GITHUB_TOKEN in your environment.',
            rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : undefined,
          },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: errorData.message || `GitHub API error (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      items: data.items || [],
      total_count: data.total_count || 0,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
    })
  } catch (error) {
    console.error('Failed to query GitHub API:', error)
    return NextResponse.json(
      { error: 'Network error connecting to GitHub. Please check your internet connection.' },
      { status: 500 }
    )
  }
}
