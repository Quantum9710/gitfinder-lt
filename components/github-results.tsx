'use client'

import * as React from 'react'
import {
  Star,
  GitFork,
  ExternalLink,
  BookOpen,
  Circle,
  AlertCircle,
  Users,
  Building,
  Bookmark,
  BookmarkCheck,
  Bot,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface GitHubRepoItem {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  topics?: string[]
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
}

export interface GitHubUserItem {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: string
}

interface ResultsProps {
  isLoading: boolean
  error: string | null
  rateLimitReset?: number
  results: {
    type: 'repositories' | 'users'
    items: (GitHubRepoItem | GitHubUserItem)[]
    total_count: number
    query: string
  } | null
  onSearchPreset?: (query: string, type: 'repositories' | 'users') => void
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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function GitHubResults({
  isLoading,
  error,
  rateLimitReset,
  results,
  onSearchPreset,
  onBookmarkToggle,
  bookmarkedIds = new Set(),
  onAskAI,
}: ResultsProps) {
  const handleDownloadResults = () => {
    if (!results || !results.items.length) return
    const exportData = {
      query: results.query,
      type: results.type,
      total_count: results.total_count,
      exported_at: new Date().toISOString(),
      items: results.items,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeQuery = results.query.replace(/[^a-zA-Z0-9_-]/g, '_') || 'results'
    a.download = `gitfinder-${results.type}-${safeQuery}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground animate-pulse">
          <div className="h-4 w-36 bg-muted rounded"></div>
          <div className="h-4 w-20 bg-muted rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-muted"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="h-3 w-1/3 bg-muted rounded"></div>
                </div>
              </div>
              <div className="h-3 w-full bg-muted rounded"></div>
              <div className="h-3 w-5/6 bg-muted rounded"></div>
              <div className="flex gap-4 pt-2">
                <div className="h-3 w-12 bg-muted rounded"></div>
                <div className="h-3 w-12 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6 my-4 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-3">
        <div className="inline-flex p-2 rounded-full bg-destructive/10 text-destructive mb-1">
          <AlertCircle className="size-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Search Request Notice</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        {rateLimitReset && (
          <p className="text-[11px] text-muted-foreground">
            Rate limit resets around {new Date(rateLimitReset * 1000).toLocaleTimeString()}.
          </p>
        )}
      </div>
    )
  }

  if (!results) {
    return (
      <div className="w-full py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 my-4">
        <div className="size-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground mb-3">
          <BookOpen className="size-6" />
        </div>
        <h3 className="text-base font-medium text-foreground">Ready to explore GitHub</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Type any repository name (e.g. <span className="font-mono text-foreground">facebook/react</span>) or username (e.g. <span className="font-mono text-foreground">torvalds</span>) above to begin searching.
        </p>

        {onSearchPreset && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md mx-auto">
            <span className="text-xs text-muted-foreground">Try searching:</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSearchPreset('next.js', 'repositories')}
            >
              next.js
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSearchPreset('shadcn-ui', 'repositories')}
            >
              shadcn-ui
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSearchPreset('vercel', 'users')}
            >
              vercel
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (results.items.length === 0) {
    return (
      <div className="w-full py-12 px-4 text-center rounded-xl border border-border/60 bg-muted/20 my-4">
        <p className="text-sm font-medium text-foreground">
          No results found for &ldquo;{results.query}&rdquo;
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Double check your spelling or try broader keywords like language or framework names.
        </p>
      </div>
    )
  }

  if (results.type === 'users') {
    const userItems = results.items as GitHubUserItem[]
    return (
      <div className="w-full space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1 pb-1">
          <div>
            Found <strong className="text-foreground">{results.total_count.toLocaleString()}</strong> users & organizations
            <span className="ml-2 text-muted-foreground/80">&bull; Showing top {userItems.length}</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={handleDownloadResults}
            className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
            title="Export search results as JSON file"
          >
            <Download className="size-3.5" />
            <span>Download Results</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {userItems.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.avatar_url}
                  alt={u.login}
                  className="size-10 rounded-full border border-border object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary">
                      {u.login}
                    </span>
                    {u.type === 'Organization' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-secondary text-secondary-foreground font-medium shrink-0">
                        <Building className="size-2.5" /> Org
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-muted text-muted-foreground font-medium shrink-0">
                        <Users className="size-2.5" /> User
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://github.com/${u.login}?tab=repositories`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>View Repositories</span>
                  </a>
                </div>
              </div>

              <a
                href={u.html_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
                title="Open GitHub Profile"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const repoItems = results.items as GitHubRepoItem[]

  return (
    <div className="w-full space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1 pb-1">
        <div>
          Found <strong className="text-foreground">{results.total_count.toLocaleString()}</strong> repositories
          <span className="ml-2 text-muted-foreground/80">&bull; Showing top {repoItems.length}</span>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={handleDownloadResults}
          className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
          title="Export search results as JSON file"
        >
          <Download className="size-3.5" />
          <span>Download Results</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {repoItems.map((repo) => {
          const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#8b949e' : null
          const isBookmarked = bookmarkedIds.has(repo.id)

          return (
            <div
              key={repo.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                {/* Header: Owner Avatar & Repo Full Name & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="size-6 rounded-full border border-border/80 object-cover shrink-0"
                    />
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sm text-foreground hover:underline truncate group-hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="truncate">{repo.full_name}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onAskAI && (
                      <button
                        type="button"
                        onClick={() => onAskAI(repo.full_name)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Analyze with AI Advisor"
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

                {/* Topics / Tags */}
                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {repo.topics.slice(0, 4).map((topic) => (
                      <span
                        key={topic}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground font-mono"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta stats footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                <div className="flex items-center gap-3.5">
                  <span className="flex items-center gap-1 hover:text-foreground">
                    <Star className="size-3.5 text-amber-500 fill-amber-500/20" />
                    <span>{formatNumber(repo.stargazers_count)}</span>
                  </span>
                  <span className="flex items-center gap-1 hover:text-foreground">
                    <GitFork className="size-3.5" />
                    <span>{formatNumber(repo.forks_count)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {repo.language && (
                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                      <Circle
                        className="size-2.5 fill-current"
                        style={{ color: langColor || undefined }}
                      />
                      <span>{repo.language}</span>
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
                    Updated {formatDate(repo.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
