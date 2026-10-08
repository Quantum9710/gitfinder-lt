'use client'

import * as React from 'react'
import { SearchInput, SearchType, SortOption } from '@/components/search-input'
import { GitHubResults, GitHubRepoItem, GitHubUserItem } from '@/components/github-results'
import { GitBranch, Sparkles, BookMarked, Search, Code2 } from 'lucide-react'

export default function Page() {
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rateLimitReset, setRateLimitReset] = React.useState<number | undefined>(undefined)
  const [results, setResults] = React.useState<{
    type: SearchType
    items: (GitHubRepoItem | GitHubUserItem)[]
    total_count: number
    query: string
  } | null>(null)

  const handleSearch = async (
    searchQuery: string,
    type: SearchType = 'repositories',
    sort: SortOption = 'stars'
  ) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type,
        sort,
      })

      const res = await fetch(`/api/github/search?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch search results from GitHub')
        setRateLimitReset(data.rateLimitReset)
        setIsLoading(false)
        return
      }

      setResults({
        type,
        items: data.items || [],
        total_count: data.total_count || 0,
        query: searchQuery.trim(),
      })
    } catch (err) {
      console.error('Search error:', err)
      setError('An error occurred while connecting to the GitHub API.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchPreset = (presetQuery: string, type: SearchType) => {
    setQuery(presetQuery)
    handleSearch(presetQuery, type, 'stars')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border/70 sticky top-0 z-20 bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              <Search className="size-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight">GitFinder</span>
              <span className="text-[10px] font-mono ml-1.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                LT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Quantum9710/gitfinder-lt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <GitBranch className="size-3.5" />
              <span className="hidden sm:inline">Quantum9710/gitfinder-lt</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border/80 text-muted-foreground mb-1">
            <Sparkles className="size-3 text-amber-500" />
            <span>GitHub Discovery Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Discover and explore GitHub
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Search across millions of repositories and developers. Enter any repository name, keyword, or username below to get started.
          </p>
        </div>

        {/* Search Component Section */}
        <div className="max-w-3xl mx-auto">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Results Section */}
        <div className="max-w-4xl mx-auto">
          <GitHubResults
            isLoading={isLoading}
            error={error}
            rateLimitReset={rateLimitReset}
            results={results}
            onSearchPreset={handleSearchPreset}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            GitFinder LT &mdash; Built with Next.js, TypeScript, Tailwind CSS &amp; shadcn UI
          </p>
          <p className="text-[11px]">
            Explore GitHub projects without friction
          </p>
        </div>
      </footer>
    </div>
  )
}
