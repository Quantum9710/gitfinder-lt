'use client'

import * as React from 'react'
import {
  TrendingUp,
  Star,
  GitFork,
  ExternalLink,
  Bot,
  Bookmark,
  BookmarkCheck,
  Circle,
  RotateCcw,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GitHubRepoItem } from '@/components/github-results'
import { cn } from '@/lib/utils'

interface TrendingRepositoriesProps {
  onBookmarkToggle?: (repo: GitHubRepoItem) => void
  bookmarkedIds?: Set<number>
  onAskAI?: (repoFullName: string) => void
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Shell: '#89e051',
  Dart: '#00B4AB',
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export function TrendingRepositories({
  onBookmarkToggle,
  bookmarkedIds = new Set(),
  onAskAI,
}: TrendingRepositoriesProps) {
  const [repos, setRepos] = React.useState<GitHubRepoItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [timeRange, setTimeRange] = React.useState<'all' | 'month' | 'week'>('all')
  const [selectedLanguage, setSelectedLanguage] = React.useState('all')

  const fetchTrending = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        timeRange,
        language: selectedLanguage,
        per_page: '8',
      })
      const res = await fetch(`/api/github/trending?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch trending repositories')
      }

      setRepos(data.items || [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error loading trending repositories')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, selectedLanguage])

  React.useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  return (
    <section className="w-full space-y-4 pt-2">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp className="size-3.5" />
            </div>
            <h2 className="font-semibold text-base sm:text-lg tracking-tight text-foreground">
              Trending Repositories
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Explore the top-starred open-source projects on GitHub
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Time Filter */}
          <div className="inline-flex p-0.5 bg-muted rounded-lg border border-border/80">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'month', label: 'Recent' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id as typeof timeRange)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium text-xs transition-all',
                  timeRange === t.id
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <select
            aria-label="Filter trending by language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-muted/70 border border-border rounded-lg px-2 py-1 text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="TypeScript">TypeScript</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Rust">Rust</option>
            <option value="Go">Go</option>
          </select>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchTrending}
            disabled={isLoading}
            title="Refresh trending repositories"
            className="size-7"
          >
            <RotateCcw className={cn('size-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-full bg-muted"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
              <div className="h-3 w-5/6 bg-muted rounded"></div>
              <div className="h-3 w-4/6 bg-muted rounded"></div>
              <div className="flex gap-4 pt-2">
                <div className="h-3 w-16 bg-muted rounded"></div>
                <div className="h-3 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center border border-border/80 rounded-xl bg-muted/20 space-y-2">
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="xs" onClick={fetchTrending}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {repos.map((repo) => {
            const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#8b949e' : null
            const isBookmarked = bookmarkedIds.has(repo.id)

            return (
              <div
                key={repo.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  {/* Top Bar: Owner Avatar, Repo Name & Action Controls */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="size-5 rounded-full border border-border/80 object-cover shrink-0"
                      />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-xs sm:text-sm text-foreground hover:underline truncate group-hover:text-primary transition-colors"
                      >
                        {repo.full_name}
                      </a>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onAskAI && (
                        <button
                          type="button"
                          onClick={() => onAskAI(repo.full_name)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Ask AI Advisor about this repo"
                        >
                          <Bot className="size-3.5" />
                        </button>
                      )}

                      {onBookmarkToggle && (
                        <button
                          type="button"
                          onClick={() => onBookmarkToggle(repo)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title={isBookmarked ? 'Remove Firestore bookmark' : 'Save to Firestore'}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="size-3.5 text-primary" />
                          ) : (
                            <Bookmark className="size-3.5" />
                          )}
                        </button>
                      )}

                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {repo.description || 'No description provided.'}
                  </p>

                  {/* Topic Badges */}
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta stats footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-foreground/90 font-medium">
                      <Star className="size-3.5 text-amber-500 fill-amber-500/20" />
                      <span>{formatNumber(repo.stargazers_count)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3.5" />
                      <span>{formatNumber(repo.forks_count)}</span>
                    </span>
                  </div>

                  {repo.language && (
                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                      <Circle
                        className="size-2.5 fill-current"
                        style={{ color: langColor || undefined }}
                      />
                      <span>{repo.language}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
