'use client'

import * as React from 'react'
import {
  Filter,
  X,
  RotateCcw,
  Scale,
  Star,
  Code2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterState {
  language: string
  license: string
  minStars: number
}

interface ResultsFilterBarProps {
  availableLanguages: string[]
  availableLicenses: string[]
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  totalCount: number
  filteredCount: number
  className?: string
}

export function ResultsFilterBar({
  availableLanguages,
  availableLicenses,
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  className,
}: ResultsFilterBarProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  const hasActiveFilters =
    filters.language !== 'all' || filters.license !== 'all' || filters.minStars > 0

  const handleReset = () => {
    onFilterChange({
      language: 'all',
      license: 'all',
      minStars: 0,
    })
  }

  const starOptions = [
    { label: 'Any Stars', value: 0 },
    { label: '≥ 500 ★', value: 500 },
    { label: '≥ 1,000 ★', value: 1000 },
    { label: '≥ 5,000 ★', value: 5000 },
    { label: '≥ 10,000 ★', value: 10000 },
    { label: '≥ 50,000 ★', value: 50000 },
  ]

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border/80 bg-muted/30 p-3 space-y-3 transition-all',
        className
      )}
    >
      {/* Filter Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
          >
            <Filter className="size-3.5 text-primary" />
            <span>Refine Results</span>
            <ChevronDown
              className={cn(
                'size-3 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {hasActiveFilters && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-medium">
              Filtered ({filteredCount}/{totalCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleReset}
              className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Showing <strong className="text-foreground">{filteredCount}</strong> of{' '}
            <strong className="text-foreground">{totalCount}</strong> repos
          </span>
        </div>
      </div>

      {/* Filter Selectors Panel */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in-0">
          {/* Language Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Code2 className="size-3" />
              <span>Language</span>
            </label>
            <select
              aria-label="Filter by programming language"
              value={filters.language}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  language: e.target.value,
                })
              }
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* License Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Scale className="size-3" />
              <span>License</span>
            </label>
            <select
              aria-label="Filter by open source license"
              value={filters.license}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  license: e.target.value,
                })
              }
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">All Licenses</option>
              {availableLicenses.map((lic) => (
                <option key={lic} value={lic}>
                  {lic}
                </option>
              ))}
            </select>
          </div>

          {/* Stars Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Star className="size-3 text-amber-500 fill-amber-500/20" />
              <span>Minimum Stars</span>
            </label>
            <select
              aria-label="Filter by minimum star count"
              value={filters.minStars}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  minStars: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {starOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
          <span className="text-muted-foreground text-[10px] mr-1">Active filters:</span>

          {filters.language !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
              <span>Lang: {filters.language}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, language: 'all' })}
                className="hover:text-destructive cursor-pointer"
                aria-label={`Remove language filter: ${filters.language}`}
              >
                <X className="size-2.5" />
              </button>
            </span>
          )}

          {filters.license !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
              <span>License: {filters.license}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, license: 'all' })}
                className="hover:text-destructive cursor-pointer"
                aria-label={`Remove license filter: ${filters.license}`}
              >
                <X className="size-2.5" />
              </button>
            </span>
          )}

          {filters.minStars > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
              <span>Stars ≥ {filters.minStars.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, minStars: 0 })}
                className="hover:text-destructive cursor-pointer"
                aria-label="Remove stars filter"
              >
                <X className="size-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
