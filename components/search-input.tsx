'use client'

import * as React from 'react'
import {
  Search,
  X,
  Loader2,
  FolderGit2,
  User,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from '@/components/audio-recorder'
import { cn } from '@/lib/utils'

export type SearchType = 'repositories' | 'users'
export type SortOption = 'stars' | 'updated' | 'best-match'

export interface SearchInputProps {
  value?: string
  onChange?: (val: string) => void
  onSearch: (query: string, type: SearchType, sort: SortOption) => void
  isLoading?: boolean
  className?: string
  placeholder?: string
  initialType?: SearchType
  showFilters?: boolean
}

export function SearchInput({
  value: controlledValue,
  onChange: controlledOnChange,
  onSearch,
  isLoading = false,
  className,
  placeholder,
  initialType = 'repositories',
  showFilters = true,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState('')
  const [searchType, setSearchType] = React.useState<SearchType>(initialType)
  const [sortBy, setSortBy] = React.useState<SortOption>('stars')
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [isFocused, setIsFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isControlled = controlledValue !== undefined
  const query = isControlled ? controlledValue : internalValue

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('gitfinder_recent_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      }
    } catch {
      // Local storage disabled or unavailable
    }
  }, [])

  // Keyboard shortcut listener (/ or cmd+k to focus)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem('gitfinder_recent_searches', JSON.stringify(updated))
    } catch {
      // Ignore storage errors
    }
  }

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem('gitfinder_recent_searches')
    } catch {
      // Ignore
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    if (!isControlled) {
      setInternalValue(nextVal)
    }
    controlledOnChange?.(nextVal)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }
    controlledOnChange?.('')
    inputRef.current?.focus()
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    // Auto-detect if user typed username/repo pattern like facebook/react while in user mode
    let targetType = searchType
    if (query.includes('/') && searchType === 'users') {
      targetType = 'repositories'
      setSearchType('repositories')
    }

    saveRecentSearch(query)
    onSearch(query.trim(), targetType, sortBy)
  }

  const handlePresetClick = (preset: string, type: SearchType) => {
    if (!isControlled) {
      setInternalValue(preset)
    }
    controlledOnChange?.(preset)
    setSearchType(type)
    saveRecentSearch(preset)
    onSearch(preset, type, sortBy)
  }

  const dynamicPlaceholder =
    placeholder ||
    (searchType === 'repositories'
      ? 'Search repositories (e.g. facebook/react, nextjs, transformers)...'
      : 'Search GitHub users or organizations (e.g. vercel, torvalds, shadcn)...')

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Type Switcher Pills */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="inline-flex p-1 bg-muted rounded-lg border border-border/80">
            <button
              type="button"
              onClick={() => {
                setSearchType('repositories')
                if (query.trim()) onSearch(query.trim(), 'repositories', sortBy)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all',
                searchType === 'repositories'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FolderGit2 className="size-3.5" />
              <span>Repositories</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchType('users')
                if (query.trim()) onSearch(query.trim(), 'users', sortBy)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all',
                searchType === 'users'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="size-3.5" />
              <span>Users & Orgs</span>
            </button>
          </div>

          {searchType === 'repositories' && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Sort:</span>
              <select
                aria-label="Sort repositories"
                value={sortBy}
                onChange={(e) => {
                  const newSort = e.target.value as SortOption
                  setSortBy(newSort)
                  if (query.trim()) onSearch(query.trim(), searchType, newSort)
                }}
                className="bg-transparent border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="stars">Most Stars</option>
                <option value="updated">Recently Updated</option>
                <option value="best-match">Best Match</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative group">
        <div
          className={cn(
            'relative flex items-center w-full rounded-xl border bg-background/80 backdrop-blur-sm transition-all duration-200 shadow-sm',
            isFocused
              ? 'border-ring ring-3 ring-ring/20 shadow-md'
              : 'border-border hover:border-border/80'
          )}
        >
          {/* Leading Icon */}
          <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-muted-foreground">
            {isLoading ? (
              <Loader2 className="size-4.5 animate-spin text-primary" />
            ) : searchType === 'repositories' ? (
              <FolderGit2 className="size-4.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            ) : (
              <User className="size-4.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            )}
          </div>

          {/* shadcn Input */}
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={dynamicPlaceholder}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:border-transparent px-1 py-2.5 h-12 text-sm sm:text-base bg-transparent placeholder:text-muted-foreground/70"
          />

          {/* Keyboard shortcut badge or Clear button */}
          <div className="flex items-center gap-1.5 pr-2.5">
            {query ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground/60 border border-border/80 rounded px-1.5 py-0.5 bg-muted/50 font-mono">
                <Command className="size-3" />
                <span>K</span>
              </div>
            )}

            {/* Microphone Voice Input (gemini-3.5-transcribe) */}
            <AudioRecorder
              variant="ghost"
              size="sm"
              className="size-8 text-muted-foreground hover:text-foreground"
              onTranscribeComplete={(text) => {
                if (!isControlled) {
                  setInternalValue(text)
                }
                controlledOnChange?.(text)
                onSearch(text, searchType, sortBy)
              }}
            />

            {/* shadcn Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              size="sm"
              className="h-8.5 px-3.5 rounded-lg font-medium shadow-xs transition-transform active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                  <span>Searching</span>
                </>
              ) : (
                <>
                  <Search className="size-3.5 mr-1" />
                  <span>Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Popular Presets & Recent Searches */}
      <div className="space-y-2 pt-0.5">
        {/* Quick Suggestion Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground text-[11px] font-medium mr-1">
            <Sparkles className="size-3 text-amber-500" />
            Trending:
          </span>
          {[
            { label: 'shadcn/ui', type: 'repositories' as SearchType },
            { label: 'facebook/react', type: 'repositories' as SearchType },
            { label: 'vercel/next.js', type: 'repositories' as SearchType },
            { label: 'torvalds', type: 'users' as SearchType },
            { label: 'tailwindlabs', type: 'users' as SearchType },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handlePresetClick(item.label, item.type)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border border-border/60 transition-colors"
            >
              {item.type === 'repositories' ? (
                <FolderGit2 className="size-2.5 opacity-60" />
              ) : (
                <User className="size-2.5 opacity-60" />
              )}
              {item.label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="size-3" />
              Recent:
            </span>
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!isControlled) setInternalValue(item)
                  controlledOnChange?.(item)
                  onSearch(item, searchType, sortBy)
                }}
                className="px-2 py-0.5 rounded text-[11px] bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-[10px] text-muted-foreground hover:text-destructive underline ml-1"
            >
              clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
